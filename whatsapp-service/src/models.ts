import mongoose, { Schema, Document, Model } from 'mongoose';

// ---- KnowledgeBase Model (mirrors lib/db/models/KnowledgeBase.ts) ----

interface IKnowledgeBase extends Document {
  content: string;
  metadata: { source: string; page: number; chunk_index: number };
  embedding: number[];
  createdAt: Date;
}

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    content: { type: String, required: true },
    metadata: {
      source: { type: String, required: true, index: true },
      page: { type: Number, required: true },
      chunk_index: { type: Number, required: true },
    },
    embedding: { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase ||
  mongoose.model<IKnowledgeBase>('KnowledgeBase', knowledgeBaseSchema);
