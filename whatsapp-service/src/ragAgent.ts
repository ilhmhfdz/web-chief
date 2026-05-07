import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { dbConnect } from './db';
import { KnowledgeBase } from './models';
import { getPersona, buildSystemPrompt } from './personaManager';

// ============================================================
// Types
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================================
// OpenAI client (singleton)
// ============================================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// Embedding
// ============================================================

/**
 * Generates a 1536-dimensional embedding vector for a query string.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });
  return response.data[0].embedding;
}

// ============================================================
// Retrieval
// ============================================================

/**
 * Retrieves the most semantically relevant knowledge chunks
 * from MongoDB Atlas using vector search.
 *
 * Falls back to empty string if the collection is empty
 * or Atlas Vector Search index is not yet created.
 */
async function retrieveContext(query: string, topK = 5): Promise<string> {
  try {
    await dbConnect();

    const queryVector = await generateEmbedding(query);

    const results = await KnowledgeBase.aggregate([
      {
        $vectorSearch: {
          index: 'knowledge_base_vector_index',
          path: 'embedding',
          queryVector,
          numCandidates: topK * 10,
          limit: topK,
        },
      },
      {
        $project: { _id: 0, content: 1, score: { $meta: 'vectorSearchScore' } },
      },
    ]);

    if (results.length > 0) {
      return results.map((doc: { content: string }) => doc.content).join('\n\n');
    }
    
    // Fallback if vector search returns 0 (index building or misconfigured)
    console.warn('[RAG] Vector search returned 0 results. Falling back to basic retrieval.');
    const fallback = await KnowledgeBase.find().limit(topK).select('content').lean();
    return fallback.map((doc: any) => doc.content).join('\n\n');
  } catch (err) {
    console.warn('[RAG] Vector search failed:', (err as Error).message);
    // Fallback on error (e.g., Atlas index not created)
    const fallback = await KnowledgeBase.find().limit(topK).select('content').lean();
    return fallback.map((doc: any) => doc.content).join('\n\n');
  }
}

// ============================================================
// Generation — full RAG pipeline
// ============================================================

/**
 * Runs the full RAG pipeline:
 * 1. Retrieve relevant context from MongoDB Atlas
 * 2. Build system prompt with persona + context
 * 3. Generate response via GPT-4o-mini
 */
export async function generateResponse(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  // 1. Retrieve context
  const context = await retrieveContext(userMessage);

  // 2. Fetch dynamic persona from Next.js API (60s cached)
  const persona = await getPersona();
  const systemPrompt = buildSystemPrompt(persona, context);

  // 3. Construct messages array
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(conversationHistory as ChatCompletionMessageParam[]),
    { role: 'user', content: userMessage },
  ];

  // 4. Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 800,
  });

  return (
    completion.choices[0]?.message?.content ??
    'Maaf, saya tidak dapat merespons saat ini. Silakan coba lagi. 🙏'
  );
}
