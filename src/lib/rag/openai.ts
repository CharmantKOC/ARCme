/**
 * Service OpenAI pour la génération de réponses avec RAG
 * Utilise GPT-4 avec le contexte des documents trouvés
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GPTConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: GPTConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 2000;
  }

  /**
   * Génère une réponse avec streaming
   */
  async *generateResponseStream(
    messages: ChatMessage[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in OpenAI stream:', error);
      throw error;
    }
  }

  /**
   * Génère une réponse complète (non-streaming)
   */
  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Crée un prompt système pour le RAG
   */
  static createSystemPrompt(): string {
    return `Tu es un assistant IA spécialisé dans l'analyse de mémoires académiques de l'ARC (Réseau des Anciens de l'Université).

Ton rôle est d'aider les utilisateurs à :
- Trouver des informations dans les mémoires académiques
- Comparer différentes approches méthodologiques
- Identifier les tendances et gaps de recherche
- Synthétiser les connaissances d'plusieurs documents

Règles importantes :
1. Base-toi UNIQUEMENT sur le contexte fourni (extraits de mémoires)
2. Si l'information n'est pas dans le contexte, dis-le clairement
3. Cite toujours tes sources (titre du mémoire, auteur)
4. Structure tes réponses de manière claire et académique
5. Utilise des emojis pour rendre la lecture agréable : 📚 📊 💡 ✅ ⚠️
6. Réponds en français

Format de réponse idéal :
📚 **Synthèse** : [réponse principale]
📊 **Sources** : [liste des mémoires utilisés]
💡 **Insights** : [observations intéressantes]
➡️ **Pour aller plus loin** : [suggestions]`;
  }

  /**
   * Formate le contexte RAG pour le prompt
   */
  static formatRAGContext(results: Array<{
    content: string;
    metadata: {
      title: string;
      author: string;
      page_number?: number;
    };
    similarity: number;
  }>): string {
    if (results.length === 0) {
      return "Aucun document pertinent trouvé dans la base de données.";
    }

    let context = `Voici ${results.length} extraits pertinents de mémoires académiques :\n\n`;
    
    results.forEach((result, idx) => {
      context += `[Document ${idx + 1}] "${result.metadata.title}" par ${result.metadata.author}`;
      if (result.metadata.page_number) {
        context += ` (page ${result.metadata.page_number})`;
      }
      context += `\nPertinence: ${(result.similarity * 100).toFixed(1)}%\n`;
      context += `Contenu:\n${result.content}\n\n`;
      context += "---\n\n";
    });

    return context;
  }
}

/**
 * Service singleton
 */
let openAIServiceInstance: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY not configured');
  }

  if (!openAIServiceInstance) {
    openAIServiceInstance = new OpenAIService({ apiKey });
  }

  return openAIServiceInstance;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY);
}
