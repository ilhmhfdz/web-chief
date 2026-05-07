import { openai } from './openai';
import { KnowledgeBase } from '@/lib/db/models/KnowledgeBase';
import dbConnect from '@/lib/db/mongoose';

/**
 * Recursively splits text into smaller chunks for vector embedding.
 * Prioritizes natural breaks (paragraphs, lines, sentences, words).
 * 
 * @param text The raw text to split
 * @param chunkSize Maximum length of each chunk
 * @param overlap Number of characters to overlap between chunks
 * @returns Array of chunk strings
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const separators = ['\n\n', '\n', '. ', ' ', ''];
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If we're at the end of the text, just grab the rest and break
    if (endIndex >= text.length) {
      chunks.push(text.slice(startIndex).trim());
      break;
    }

    // Try to find the best separator to split on, searching backwards from endIndex
    let splitIndex = endIndex;
    for (const separator of separators) {
      if (separator === '') continue; // Skip empty string (hard split fallback)
      
      const lastMatch = text.lastIndexOf(separator, endIndex);
      
      // Ensure the separator isn't too far back, preventing tiny chunks
      if (lastMatch > startIndex + (chunkSize / 2)) {
        splitIndex = lastMatch + separator.length;
        break;
      }
    }

    chunks.push(text.slice(startIndex, splitIndex).trim());
    
    // Move start index for next chunk, stepping back by overlap
    startIndex = splitIndex - overlap;
    
    // Safety fallback to prevent infinite loops if overlap is too large
    if (startIndex <= splitIndex - chunkSize) {
       startIndex = splitIndex;
    }
  }

  // Filter out any empty strings just in case
  return chunks.filter(c => c.length > 0);
}

/**
 * Generates a 1536-dimensional vector embedding for a given text.
 * 
 * @param text The text to embed
 * @returns Array of 1536 floats
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    // Replace newlines with spaces as recommended by OpenAI for better embedding performance
    input: text.replace(/\n/g, ' '),
  });
  
  return response.data[0].embedding;
}

/**
 * Processes a raw PDF text string: chunks it, embeds it, and stores it in MongoDB.
 * 
 * @param pdfText The raw extracted text from the PDF
 * @param source The source filename or identifier
 */
export async function storePDFKnowledge(pdfText: string, source: string): Promise<void> {
  await dbConnect(); // Ensure database connection
  
  const chunks = chunkText(pdfText);
  const knowledgeBaseDocs = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Generate embedding vector using OpenAI
    const embedding = await generateEmbedding(chunk);
    
    knowledgeBaseDocs.push({
      content: chunk,
      metadata: {
        source,
        page: 1, // Optional: Update if you use a PDF parser that returns page numbers
        chunk_index: i,
      },
      embedding,
    });
  }

  // Bulk insert for efficiency
  if (knowledgeBaseDocs.length > 0) {
    await KnowledgeBase.insertMany(knowledgeBaseDocs);
  }
  
  console.log(`✅ Stored ${knowledgeBaseDocs.length} chunks from [${source}]`);
}
