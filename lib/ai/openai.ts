import OpenAI from 'openai';

// Ensure the API key is present
if (!process.env.OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY environment variable. AI features will fail.');
}

/**
 * Global singleton OpenAI client.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
