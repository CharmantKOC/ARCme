import { supabase } from '@/integrations/supabase/client';
import { cosineSimilarity } from './embeddings';

export interface SearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  pageNumber: number;
  similarity: number;
  metadata?: {
    title: string;
    author: string;
    year: number;
    domain: string;
  };
}

/**
 * Recherche sémantique dans les chunks de documents via pgvector
 */
export async function semanticSearch(
  queryEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number;
    documentIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.7, documentIds } = options;

  try {
    // Construire la requête avec pgvector
    // Convert the embedding array to a string format that pgvector expects
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    let query = supabase
      .rpc('match_document_chunks', {
        query_embedding: embeddingString,
        match_threshold: threshold,
        match_count: limit
      });

    // Filtrer par documents si spécifié
    if (documentIds && documentIds.length > 0) {
      query = query.in('document_id', documentIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error in semantic search:', error);
      throw error;
    }

    // Enrichir les résultats avec les métadonnées des documents
    const results: SearchResult[] = await Promise.all(
      (data || []).map(async (chunk: any) => {
        const { data: docData } = await supabase
          .from('documents')
          .select('title, author, year, domain')
          .eq('id', chunk.document_id)
          .single();

        return {
          documentId: chunk.document_id,
          chunkId: chunk.id,
          content: chunk.content,
          pageNumber: chunk.page_number,
          similarity: chunk.similarity,
          metadata: docData ? {
            title: docData.title,
            author: docData.author,
            year: docData.year,
            domain: docData.domain
          } : undefined
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Recherche hybride: combine recherche sémantique et recherche par mots-clés
 */
export async function hybridSearch(
  query: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    semanticWeight?: number;
    keywordWeight?: number;
  } = {}
): Promise<SearchResult[]> {
  const { 
    limit = 10, 
    semanticWeight = 0.7, 
    keywordWeight = 0.3 
  } = options;

  try {
    // 1. Recherche sémantique
    const semanticResults = await semanticSearch(queryEmbedding, { 
      limit: limit * 2,
      threshold: 0.5 
    });

    // 2. Recherche par mots-clés (full-text search)
    const { data: keywordResults, error } = await supabase
      .from('document_chunks')
      .select('*, documents!inner(title, author, year, domain)')
      .textSearch('content', query, { 
        type: 'websearch',
        config: 'french'
      })
      .limit(limit * 2);

    if (error) throw error;

    // 3. Combiner et scorer les résultats
    const combinedResults = new Map<string, SearchResult>();

    // Ajouter les résultats sémantiques
    semanticResults.forEach((result, index) => {
      const score = (1 - index / semanticResults.length) * semanticWeight;
      combinedResults.set(result.chunkId, {
        ...result,
        similarity: score
      });
    });

    // Ajouter/fusionner les résultats par mots-clés
    keywordResults?.forEach((result: any, index) => {
      const keywordScore = (1 - index / keywordResults.length) * keywordWeight;
      const existing = combinedResults.get(result.id);

      if (existing) {
        // Fusionner les scores
        existing.similarity += keywordScore;
      } else {
        combinedResults.set(result.id, {
          documentId: result.document_id,
          chunkId: result.id,
          content: result.content,
          pageNumber: result.page_number,
          similarity: keywordScore,
          metadata: {
            title: result.documents.title,
            author: result.documents.author,
            year: result.documents.year,
            domain: result.documents.domain
          }
        });
      }
    });

    // Trier par score combiné et limiter
    return Array.from(combinedResults.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
}

/**
 * Recherche de documents similaires à un document donné
 */
export async function findSimilarDocuments(
  documentId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Récupérer les embeddings moyens du document source
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('embedding')
      .eq('document_id', documentId);

    if (chunksError) throw chunksError;

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Calculer l'embedding moyen du document
    // Parse the string embeddings back to number arrays
    const embeddings = chunks.map(chunk => JSON.parse(chunk.embedding as string) as number[]);
    const avgEmbedding = embeddings.reduce((acc, embedding) => {
      return acc.map((val, i) => val + embedding[i] / chunks.length);
    }, new Array(embeddings[0].length).fill(0));

    // Rechercher des documents similaires
    const results = await semanticSearch(avgEmbedding, { 
      limit: limit + 1,  // +1 car le document source sera inclus
      threshold: 0.6
    });

    // Filtrer le document source et regrouper par document
    const documentMap = new Map<string, SearchResult>();
    
    results
      .filter(r => r.documentId !== documentId)
      .forEach(result => {
        if (!documentMap.has(result.documentId)) {
          documentMap.set(result.documentId, result);
        }
      });

    return Array.from(documentMap.values()).slice(0, limit);

  } catch (error) {
    console.error('Error finding similar documents:', error);
    throw error;
  }
}

/**
 * Recherche locale (côté client) dans les chunks chargés en mémoire
 * Utile pour recherche instantanée sans requête DB
 */
export function localSemanticSearch(
  queryEmbedding: number[],
  chunks: Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata?: any;
  }>,
  limit: number = 5
): Array<{ id: string; content: string; similarity: number; metadata?: any }> {
  // Calculer la similarité pour chaque chunk
  const results = chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.content,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    metadata: chunk.metadata
  }));

  // Trier par similarité et limiter
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Fonction helper pour préparer le contexte pour l'Assistant IA
 */
export async function retrieveContextForQuery(
  query: string,
  queryEmbedding: number[],
  maxChunks: number = 5
): Promise<string> {
  try {
    const results = await semanticSearch(queryEmbedding, {
      limit: maxChunks,
      threshold: 0.65
    });

    if (results.length === 0) {
      return "Aucun contexte pertinent trouvé dans la base de documents.";
    }

    // Formatter le contexte pour le LLM
    let context = "Voici les extraits pertinents des documents académiques :\n\n";

    results.forEach((result, index) => {
      context += `[Source ${index + 1}] "${result.metadata?.title}" par ${result.metadata?.author} (${result.metadata?.year})\n`;
      context += `Page ${result.pageNumber}:\n${result.content}\n\n`;
    });

    return context;
  } catch (error) {
    console.error('Error retrieving context:', error);
    return "Erreur lors de la récupération du contexte.";
  }
}
