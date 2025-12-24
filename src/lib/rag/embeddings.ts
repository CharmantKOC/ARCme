/**
 * Module de génération d'embeddings pour le système RAG
 * Supporte OpenAI et peut être étendu à d'autres providers
 */

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  dimensionality: number;
}

/**
 * Configuration OpenAI Embeddings
 */
class OpenAIEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  public dimensionality: number;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
    // text-embedding-3-small = 1536 dimensions
    // text-embedding-3-large = 3072 dimensions
    this.dimensionality = model.includes('large') ? 3072 : 1536;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: this.model
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // OpenAI limite à 2048 inputs par batch
      const batchSize = 2048;
      const batches: string[][] = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        batches.push(texts.slice(i, i + batchSize));
      }

      const allEmbeddings: number[][] = [];

      for (const batch of batches) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            input: batch,
            model: this.model
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const embeddings = data.data.map((item: any) => item.embedding);
        allEmbeddings.push(...embeddings);
      }

      return allEmbeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }
}

/**
 * Provider factice pour développement/tests (génère des vecteurs aléatoires)
 */
class MockEmbeddings implements EmbeddingProvider {
  public dimensionality = 1536;

  async generateEmbedding(text: string): Promise<number[]> {
    // Génère un vecteur normalisé aléatoire
    const embedding = Array.from({ length: this.dimensionality }, () => Math.random() - 0.5);
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
}

/**
 * Factory pour créer le provider d'embeddings approprié
 */
export function createEmbeddingProvider(config?: {
  provider?: 'openai' | 'mock';
  apiKey?: string;
  model?: string;
}): EmbeddingProvider {
  const { provider = 'mock', apiKey, model } = config || {};

  switch (provider) {
    case 'openai':
      if (!apiKey) {
        console.warn('OpenAI API key not provided, falling back to mock embeddings');
        return new MockEmbeddings();
      }
      return new OpenAIEmbeddings(apiKey, model);
    
    case 'mock':
    default:
      return new MockEmbeddings();
  }
}

/**
 * Fonction helper pour générer des embeddings depuis Supabase Edge Function
 * À utiliser côté backend pour plus de sécurité
 */
export async function generateEmbeddingViaEdgeFunction(
  text: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<number[]> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw error;
  }
}

/**
 * Normalise un vecteur d'embedding (utile pour le cosine similarity)
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

/**
 * Calcule la similarité cosine entre deux embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensionality');
  }
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (normA * normB);
}
