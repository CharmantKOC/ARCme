/**
 * Service principal du système RAG (Retrieval Augmented Generation)
 * Orchestre l'extraction, le chunking, l'embedding et la recherche
 */

import { supabase } from '@/integrations/supabase/client';
import { processPDFFromStorage } from './pdfProcessor';
import { createEmbeddingProvider, type EmbeddingProvider } from './embeddings';
import { semanticSearch, hybridSearch, retrieveContextForQuery } from './vectorSearch';
import type { DocumentChunk } from './pdfProcessor';

export interface RAGConfig {
  embeddingProvider?: 'openai' | 'mock';
  openaiApiKey?: string;
  embeddingModel?: string;
}

export class RAGService {
  private embeddingProvider: EmbeddingProvider;

  constructor(config: RAGConfig = {}) {
    this.embeddingProvider = createEmbeddingProvider({
      provider: config.embeddingProvider || 'mock',
      apiKey: config.openaiApiKey,
      model: config.embeddingModel
    });
  }

  /**
   * Traite un nouveau document: extraction, chunking, embedding, stockage
   */
  async processNewDocument(documentId: string): Promise<void> {
    try {
      console.log(`Starting RAG processing for document: ${documentId}`);

      // 1. Récupérer les métadonnées du document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // 2. Récupérer l'URL du fichier depuis Supabase Storage
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (!urlData?.signedUrl) {
        throw new Error('Failed to get document URL');
      }

      // 3. Extraire et chunker le PDF
      console.log(`Extracting and chunking PDF: ${document.title}`);
      const chunks = await processPDFFromStorage(urlData.signedUrl, {
        documentId: document.id,
        title: document.title,
        author: document.author
      });

      console.log(`Generated ${chunks.length} chunks`);

      // 4. Générer les embeddings
      console.log('Generating embeddings...');
      const texts = chunks.map(c => c.content);
      const embeddings = await this.embeddingProvider.generateBatchEmbeddings(texts);

      // 5. Stocker les chunks avec leurs embeddings
      console.log('Storing chunks in database...');
      const chunksToInsert = chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        embedding: JSON.stringify(embeddings[index]), // Convert to string for pgvector
        metadata: { page_number: chunk.pageNumber }
      }));

      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(chunksToInsert);

      if (insertError) {
        throw insertError;
      }

      console.log(`Successfully processed document: ${document.title}`);
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Traite tous les documents existants en batch
   */
  async processAllDocuments(progressCallback?: (current: number, total: number) => void): Promise<void> {
    try {
      // Récupérer tous les documents qui n'ont pas encore de chunks
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, title')
        .not('id', 'in', 
          supabase.from('document_chunks').select('document_id')
        );

      if (error) throw error;

      if (!documents || documents.length === 0) {
        console.log('No documents to process');
        return;
      }

      console.log(`Processing ${documents.length} documents...`);

      for (let i = 0; i < documents.length; i++) {
        try {
          await this.processNewDocument(documents[i].id);
          progressCallback?.(i + 1, documents.length);
        } catch (error) {
          console.error(`Failed to process document ${documents[i].title}:`, error);
          // Continue with next document
        }
      }

      console.log('Batch processing complete');
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  }

  /**
   * Recherche sémantique avec génération de contexte pour l'IA
   */
  async searchAndGenerateContext(
    query: string,
    options: {
      maxChunks?: number;
      useHybridSearch?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const { maxChunks = 5, useHybridSearch = true } = options;

      // Générer l'embedding de la requête
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);

      // Effectuer la recherche
      let results;
      if (useHybridSearch) {
        results = await hybridSearch(query, queryEmbedding, { limit: maxChunks });
      } else {
        results = await semanticSearch(queryEmbedding, { limit: maxChunks });
      }

      if (results.length === 0) {
        return "Aucun document pertinent trouvé pour cette requête.";
      }

      // Formatter le contexte
      let context = "📚 **Documents pertinents trouvés :**\n\n";

      results.forEach((result, index) => {
        context += `**[${index + 1}] ${result.metadata?.title}**\n`;
        context += `Auteur: ${result.metadata?.author} (${result.metadata?.year})\n`;
        context += `Domaine: ${result.metadata?.domain}\n`;
        context += `Page ${result.pageNumber} - Score: ${(result.similarity * 100).toFixed(1)}%\n\n`;
        context += `> ${result.content.substring(0, 300)}...\n\n`;
        context += `---\n\n`;
      });

      return context;
    } catch (error) {
      console.error('Error in search and generate context:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un document a déjà été traité
   */
  async isDocumentProcessed(documentId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking document status:', error);
      return false;
    }
  }

  /**
   * Supprime les chunks d'un document (pour retraitement)
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting document chunks:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques du système RAG
   */
  async getRAGStats(): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    totalChunks: number;
    averageChunksPerDocument: number;
  }> {
    try {
      const { count: totalDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      const { data: processedDocs } = await supabase
        .from('document_chunks')
        .select('document_id', { count: 'exact' })
        .limit(1000);

      const uniqueDocs = new Set(processedDocs?.map(d => d.document_id) || []);

      return {
        totalDocuments: totalDocs || 0,
        processedDocuments: uniqueDocs.size,
        totalChunks: totalChunks || 0,
        averageChunksPerDocument: uniqueDocs.size > 0 
          ? Math.round((totalChunks || 0) / uniqueDocs.size) 
          : 0
      };
    } catch (error) {
      console.error('Error getting RAG stats:', error);
      return {
        totalDocuments: 0,
        processedDocuments: 0,
        totalChunks: 0,
        averageChunksPerDocument: 0
      };
    }
  }
}

// Export singleton instance
let ragServiceInstance: RAGService | null = null;

export function getRAGService(config?: RAGConfig): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService(config);
  }
  return ragServiceInstance;
}

export function resetRAGService(): void {
  ragServiceInstance = null;
}
