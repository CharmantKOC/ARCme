/**
 * Module RAG (Retrieval Augmented Generation) - Point d'entrée principal
 * 
 * Ce module fournit un système complet de recherche sémantique et de génération
 * augmentée pour les documents académiques.
 * 
 * @example
 * ```typescript
 * import { getRAGService } from '@/lib/rag';
 * 
 * const ragService = getRAGService({
 *   embeddingProvider: 'openai',
 *   openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
 * });
 * 
 * // Traiter un nouveau document
 * await ragService.processNewDocument(documentId);
 * 
 * // Rechercher et obtenir du contexte
 * const context = await ragService.searchAndGenerateContext('IA éthique');
 * ```
 */

// Services principaux
export { RAGService, getRAGService, resetRAGService } from './ragService';
export type { RAGConfig } from './ragService';
import { getRAGService } from './ragService';

// Traitement PDF
export {
  extractTextFromPDF,
  chunkDocument,
  processPDFDocument,
  processPDFFromStorage
} from './pdfProcessor';
export type { DocumentChunk } from './pdfProcessor';

// Embeddings
export {
  createEmbeddingProvider,
  generateEmbeddingViaEdgeFunction,
  normalizeEmbedding,
  cosineSimilarity
} from './embeddings';
export type { EmbeddingProvider } from './embeddings';

// Recherche vectorielle
export {
  semanticSearch,
  hybridSearch,
  findSimilarDocuments,
  localSemanticSearch,
  retrieveContextForQuery
} from './vectorSearch';
export type { SearchResult } from './vectorSearch';

/**
 * Configuration par défaut du système RAG
 */
export const DEFAULT_RAG_CONFIG = {
  // Chunking
  chunkSize: 1000,  // ~250 tokens
  chunkOverlap: 200,  // ~50 tokens
  
  // Embeddings
  embeddingModel: 'text-embedding-3-small',
  embeddingDimension: 1536,
  
  // Recherche
  defaultSearchLimit: 5,
  defaultSimilarityThreshold: 0.7,
  hybridSearchSemanticWeight: 0.7,
  hybridSearchKeywordWeight: 0.3,
  
  // Batch processing
  batchSize: 10,
  maxRetries: 3
} as const;

/**
 * Helpers pour la configuration
 */
export function getOpenAIApiKey(): string | undefined {
  return import.meta.env.VITE_OPENAI_API_KEY;
}

export function isRAGEnabled(): boolean {
  // RAG est activé si on a une clé API OpenAI ou si on est en mode mock
  return Boolean(getOpenAIApiKey()) || import.meta.env.VITE_RAG_MOCK_MODE === 'true';
}

export function getRAGMode(): 'openai' | 'mock' {
  return getOpenAIApiKey() ? 'openai' : 'mock';
}

/**
 * Instance par défaut du service RAG
 */
const defaultRAGService = getRAGService({
  embeddingProvider: getRAGMode(),
  openaiApiKey: getOpenAIApiKey()
});

/**
 * Raccourcis pour les méthodes les plus courantes
 */
export const processNewDocument = (documentId: string) => 
  defaultRAGService.processNewDocument(documentId);

export const processAllDocuments = () => 
  defaultRAGService.processAllDocuments();

export const searchAndGenerateContext = (query: string, options?: any) => 
  defaultRAGService.searchAndGenerateContext(query, options);

export const getRAGStatistics = () => 
  defaultRAGService.getRAGStats();
