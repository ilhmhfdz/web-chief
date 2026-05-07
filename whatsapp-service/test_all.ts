import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });
import { dbConnect } from './src/db';
import { KnowledgeBase } from './src/models';

async function test() {
  await dbConnect();
  const count = await KnowledgeBase.countDocuments();
  console.log("Count:", count);
  const doc = await KnowledgeBase.findOne();
  if (doc) console.log("Content:", doc.content.substring(0, 100));
  process.exit(0);
}
test();
