import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a Product document in MongoDB.
 */
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: 'pomade' | 'shampoo' | 'tools' | 'accessories';
  image_url: string;
  images?: string[];
  tags: string[];
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      // Slug is required but will be auto-generated if not provided
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['pomade', 'shampoo', 'tools', 'accessories'],
    },
    image_url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true, // Useful for queries
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Pre-validate hook to generate slug from name
productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
      .replace(/(^-|-$)+/g, '');   // Remove leading/trailing hyphens
  }
  next();
});

// [DB-01] Compound indexes for product catalog queries:
// - is_active + category + createdAt: browse by category sorted by newest
// - is_active + price: price sort across catalog
// - text index on name/description/tags: replaces slow $regex for search
productSchema.index({ is_active: 1, category: 1, createdAt: -1 });
productSchema.index({ is_active: 1, price: 1 });
productSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, tags: 5, description: 1 }, name: 'product_text_search' }
);

// Use existing model if already compiled (for Next.js HMR)
export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export default Product;
