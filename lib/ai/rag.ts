import { openai } from './openai';
import { KnowledgeBase } from '@/lib/db/models/KnowledgeBase';
import { generateEmbedding } from './embeddings';
import dbConnect from '@/lib/db/mongoose';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Retrieves the most relevant context chunks from the KnowledgeBase using Atlas Vector Search.
 * 
 * @param query The user's message
 * @param topK Number of chunks to retrieve (default: 5)
 * @returns A single string combining all retrieved context
 */
export async function retrieveContext(query: string, topK: number = 5): Promise<string> {
  await dbConnect();
  
  // 1. Generate embedding for the user's query
  const queryVector = await generateEmbedding(query);

  // 2. Run MongoDB Atlas $vectorSearch pipeline
  const results = await KnowledgeBase.aggregate([
    {
      $vectorSearch: {
        index: 'knowledge_base_vector_index',
        path: 'embedding',
        queryVector: queryVector,
        numCandidates: 50, // MongoDB recommends numCandidates to be roughly 10x limit
        limit: topK,
      }
    },
    {
      $project: {
        _id: 0,
        content: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]);

  // 3. Join retrieved chunks into a single context string
  return results.map(doc => doc.content).join('\n\n');
}

/**
 * Injects retrieved context into the system persona template.
 * 
 * @param persona The core system prompt definition
 * @param context The text retrieved from the KnowledgeBase
 * @returns The compiled system prompt
 */
export function buildSystemPrompt(persona: string, context: string): string {
  return `${persona}\n\nBerikut adalah informasi relevan dari basis pengetahuan:\n\n${context}\n\nJawab hanya berdasarkan informasi di atas.`;
}

/**
 * Orchestrates the full RAG pipeline: retrieves context, builds the prompt, and queries GPT-4o mini.
 * 
 * @param userMessage The latest user query
 * @param conversationHistory Previous messages in the session
 * @returns The generated assistant reply
 */
export async function generateResponse(userMessage: string, conversationHistory: Message[]): Promise<string> {
  // 1. Retrieve relevant context from MongoDB Atlas
  const context = await retrieveContext(userMessage);

  // 2. Fetch current system prompt
  // In a full implementation, you would query this from a Persona collection or settings table.
  // Using a fallback default persona here:
  const defaultPersona = "Anda adalah AI Assistant untuk Chief Supplies, platform e-commerce produk grooming pria premium.";
  let persona = defaultPersona;
  
  // (Optional: fetch from DB here if Persona model is created)
  
  const systemPrompt = buildSystemPrompt(persona, context);

  // 3. Construct message array for OpenAI
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(conversationHistory as ChatCompletionMessageParam[]),
    { role: 'user', content: userMessage }
  ];

  // 4. Call GPT-4o mini
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Maaf, saya tidak dapat merespons saat ini.';
}
