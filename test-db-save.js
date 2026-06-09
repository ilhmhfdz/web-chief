import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const MessageSchema = new mongoose.Schema({
    senderRole: { type: String, enum: ['user', 'admin', 'ai'] },
    message: { type: String }
  });
  const ConvSchema = new mongoose.Schema({
    messages: [MessageSchema]
  });
  const Conv = mongoose.models.TestConv || mongoose.model('TestConv', ConvSchema);
  
  const c = new Conv({ messages: [] });
  await c.save();
  
  c.messages.push({ senderRole: 'user', message: 'Hello' });
  await c.save();
  
  c.messages.push({ senderRole: 'ai', message: 'Hi there' });
  await c.save();
  
  const fromDb = await Conv.findById(c._id);
  console.log('Messages in DB:', fromDb.messages.length); // Should be 2
  process.exit(0);
}
run();
