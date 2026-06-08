import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================
// Interfaces
// ============================================================

/**
 * Version history entry — stores previous content for
 * AI hallucination mitigation and audit trail.
 */
export interface IVersionEntry {
  content: string;
  adapted_at: Date;
  ai_summary_of_changes: string;
}

/**
 * Interface representing an Adaptive Article document in MongoDB.
 * These articles are autonomously rewritten by Claude AI using
 * Generative Engine Optimization (GEO) strategies.
 */
export interface IAdaptiveArticle extends Document {
  slug: string;
  title: string;
  current_content: string;
  meta_description: string;
  geo_keywords: string[];
  related_products: Types.ObjectId[];
  last_adapted_at: Date | null;
  is_active: boolean;
  version_history: IVersionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Sub-schemas
// ============================================================

const versionEntrySchema = new Schema<IVersionEntry>(
  {
    content: {
      type: String,
      required: [true, 'Version content is required'],
    },
    adapted_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ai_summary_of_changes: {
      type: String,
      required: [true, 'AI summary of changes is required'],
      default: 'Initial version',
    },
  },
  { _id: false } // Prevent creating independent ObjectIds for sub-documents
);

// ============================================================
// Main Schema
// ============================================================

const adaptiveArticleSchema = new Schema<IAdaptiveArticle>(
  {
    slug: {
      type: String,
      required: [true, 'Article slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
    },
    current_content: {
      type: String,
      required: [true, 'Article content is required'],
    },
    meta_description: {
      type: String,
      default: '',
    },
    geo_keywords: {
      type: [String],
      default: [],
      index: true,
    },
    related_products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    last_adapted_at: {
      type: Date,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    version_history: {
      type: [versionEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// ============================================================
// Indexes
// ============================================================

// Active articles sorted by last adaptation date (cron job queries)
adaptiveArticleSchema.index({ is_active: 1, last_adapted_at: -1 });

// Slug lookup — unique index already from field definition
// Text search on title and keywords for admin search
adaptiveArticleSchema.index(
  { title: 'text', geo_keywords: 'text' },
  { weights: { title: 10, geo_keywords: 5 }, name: 'article_text_search' }
);

// ============================================================
// Export — serverless cache pattern (Next.js HMR safe)
// ============================================================

export const AdaptiveArticle: Model<IAdaptiveArticle> =
  mongoose.models.AdaptiveArticle ||
  mongoose.model<IAdaptiveArticle>('AdaptiveArticle', adaptiveArticleSchema);

export default AdaptiveArticle;
