import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderRole: { type: String, enum: ['user', 'admin', 'ai'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  subject: { type: String, default: 'General Support' },
  messages: [MessageSchema],
  handledBy: { type: String, enum: ['ai', 'human'], default: 'ai' },
  lastMessageAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
