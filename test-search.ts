import * as fs from 'fs';
// Load .env.local manually (no dotenv dependency)
fs.readFileSync('.env.local', 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i < 0) return;
  const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
  if (!process.env[k]) process.env[k] = v;
});

import dbConnect from './lib/db/mongoose';
import { KnowledgeBase } from './lib/db/models/KnowledgeBase';

async function test() {
  await dbConnect();
  try {
    const queryVector = Array(1536).fill(0.1);
    const results = await KnowledgeBase.aggregate([
      {
        $vectorSearch: {
          index: 'knowledge_base_vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 50,
          limit: 5,
        },
      },
    ]);
    console.log("Results length:", results.length);
    if (results.length > 0) {
      console.log("Score:", results[0].score);
    }
  } catch (err: any) {
    console.error("Vector search error:", err.message);
  }
  process.exit(0);
}
test();
