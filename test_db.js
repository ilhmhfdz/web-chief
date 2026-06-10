import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const conv = await mongoose.connection.collection('conversations').findOne({ _id: new mongoose.Types.ObjectId("6a0152b4d6d98463ac6c4d45") });
  console.log("Conversation:", conv);
  process.exit(0);
}
run();
