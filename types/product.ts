// ============================================================
// Domain Types — Product & Cart
// These are plain serializable types used across client/server.
// Do NOT import Mongoose documents here.
// ============================================================
export type ProductCategory = 'pomade' | 'shampoo' | 'dry-sand' | 'hair-care';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  image_url: string; // Main image
  images?: string[]; // Gallery images
  tags: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Cart ----

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// ---- API Responses ----

export interface ProductsApiResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: ProductCategory | 'all';
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular' | 'bestseller';
  minRating?: number;
}

// ---- Category metadata for UI ----

export interface CategoryMeta {
  value: ProductCategory | 'all';
  label: string;
  emoji: string; // Kept as string for backward compatibility, but using symbols instead of emojis
}

export const PRODUCT_CATEGORIES: CategoryMeta[] = [
  { value: 'all', label: 'Semua', emoji: '⊞' },
  { value: 'pomade', label: 'Pomade', emoji: '✧' },
  { value: 'shampoo', label: 'Shampo', emoji: '◇' },
  { value: 'dry-sand', label: 'Dry Sand', emoji: '❄' },
  { value: 'hair-care', label: 'Hair Care', emoji: '✦' },
];

export const SORT_OPTIONS = [
  { value: 'popular',    label: 'Populer',                  icon: '🔥' },
  { value: 'newest',     label: 'Terbaru',                  icon: '✨' },
  { value: 'bestseller', label: 'Terlaris',                 icon: '🏆' },
  { value: 'price_asc',  label: 'Harga: Rendah ke Tinggi',  icon: '↑'  },
  { value: 'price_desc', label: 'Harga: Tinggi ke Rendah',  icon: '↓'  },
] as const;
