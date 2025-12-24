import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configuration du worker PDF.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface DocumentChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  metadata?: {
    documentId: string;
    title: string;
    author: string;
  };
}

/**
 * Extrait le texte complet d'un PDF depuis une URL ou un blob
 */
export async function extractTextFromPDF(pdfSource: string | Uint8Array): Promise<string> {
  try {
    const loadingTask = getDocument(pdfSource);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Parcourir toutes les pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extraire le texte de chaque item
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Découpe un texte en chunks de taille optimale pour les embeddings
 * Stratégie: découpage par paragraphes avec overlap pour garder le contexte
 */
export function chunkDocument(
  text: string, 
  options: {
    chunkSize?: number;
    overlap?: number;
    documentId?: string;
    title?: string;
    author?: string;
  } = {}
): DocumentChunk[] {
  const {
    chunkSize = 1000,  // ~250 tokens
    overlap = 200,      // ~50 tokens overlap
    documentId = '',
    title = '',
    author = ''
  } = options;

  const chunks: DocumentChunk[] = [];
  
  // Nettoyer le texte
  const cleanedText = text
    .replace(/\s+/g, ' ')  // Normaliser les espaces
    .replace(/\n{3,}/g, '\n\n')  // Limiter les sauts de ligne
    .trim();

  // Découper par pages d'abord
  const pages = cleanedText.split(/--- Page \d+ ---/);
  
  let globalChunkIndex = 0;

  pages.forEach((pageText, pageIndex) => {
    if (!pageText.trim()) return;

    // Découper la page en paragraphes
    const paragraphs = pageText.split(/\n\n+/).filter(p => p.trim().length > 50);
    
    let currentChunk = '';
    
    paragraphs.forEach((paragraph) => {
      // Si ajouter ce paragraphe dépasse la taille max
      if (currentChunk.length + paragraph.length > chunkSize) {
        // Sauvegarder le chunk actuel
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            pageNumber: pageIndex + 1,
            chunkIndex: globalChunkIndex++,
            metadata: {
              documentId,
              title,
              author
            }
          });
        }
        
        // Commencer un nouveau chunk avec overlap
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + ' ' + paragraph;
      } else {
        // Ajouter au chunk actuel
        currentChunk += (currentChunk ? ' ' : '') + paragraph;
      }
    });

    // Ajouter le dernier chunk de la page
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: pageIndex + 1,
        chunkIndex: globalChunkIndex++,
        metadata: {
          documentId,
          title,
          author
        }
      });
    }
  });

  return chunks;
}

/**
 * Traite un document PDF complet: extraction + chunking
 */
export async function processPDFDocument(
  pdfSource: string | Uint8Array,
  metadata: {
    documentId: string;
    title: string;
    author: string;
  }
): Promise<DocumentChunk[]> {
  try {
    // 1. Extraire le texte
    console.log(`Extracting text from PDF: ${metadata.title}`);
    const fullText = await extractTextFromPDF(pdfSource);
    
    if (!fullText || fullText.length < 100) {
      throw new Error('Insufficient text extracted from PDF');
    }
    
    // 2. Découper en chunks
    console.log(`Chunking document: ${metadata.title} (${fullText.length} characters)`);
    const chunks = chunkDocument(fullText, {
      chunkSize: 1000,
      overlap: 200,
      ...metadata
    });
    
    console.log(`Created ${chunks.length} chunks for document: ${metadata.title}`);
    
    return chunks;
  } catch (error) {
    console.error(`Error processing PDF document ${metadata.title}:`, error);
    throw error;
  }
}

/**
 * Fonction helper pour télécharger et traiter un PDF depuis Supabase Storage
 */
export async function processPDFFromStorage(
  storageUrl: string,
  metadata: {
    documentId: string;
    title: string;
    author: string;
  }
): Promise<DocumentChunk[]> {
  try {
    // Télécharger le PDF
    const response = await fetch(storageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Traiter le PDF
    return await processPDFDocument(uint8Array, metadata);
  } catch (error) {
    console.error(`Error processing PDF from storage ${storageUrl}:`, error);
    throw error;
  }
}
