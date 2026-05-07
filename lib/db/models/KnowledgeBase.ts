import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a chunk of text stored for RAG processing.
 */
export interface IKnowledgeBase extends Document {
  content: string;
  metadata: {
    source: string;
    page: number;
    chunk_index: number;
  };
  embedding: number[]; // 1536-dimensional vector for OpenAI
  createdAt: Date;
}

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    content: {
      type: String,
      required: [true, 'Content chunk is required'],
    },
    metadata: {
      source: {
        type: String,
        required: [true, 'Source filename is required'],
        index: true,
      },
      page: {
        type: Number,
        required: true,
      },
      chunk_index: {
        type: Number,
        required: true,
      },
    },
    embedding: {
      type: [Number],
      required: [true, 'Vector embedding is required'],
      // Note: Do not define standard MongoDB indexes for vector fields here.
      // Vector search requires a specific Atlas Search Index definition.
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt based on requirements
  }
);

// Use existing model if already compiled (for Next.js HMR)
export const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase || mongoose.model<IKnowledgeBase>('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
