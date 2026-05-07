// ============================================================
// Dummy Reviews & Sales Data
// Static data to enrich the catalog UI experience
// ============================================================

export interface DummyReview {
  id: string;
  author: string;
  avatar: string; // initials
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ProductSalesData {
  soldCount: number;        // total sold (for "200+ Terjual" badge)
  monthlySold: number;      // sold per month (for "terlaris" label)
  rating: number;           // average rating (1–5)
  reviewCount: number;
  isBestseller: boolean;    // show "Terlaris" tag
  isPopular: boolean;       // most purchased overall
}

// ---- Dummy reviews pool ----

export const DUMMY_REVIEWS: Record<string, DummyReview[]> = {
  // By slug — fallback to 'default' if slug not matched
  default: [
    {
      id: 'r1',
      author: 'Rizky A.',
      avatar: 'RA',
      rating: 5,
      date: '2 hari lalu',
      comment: 'Produk bagus banget! Hasilnya natural dan tahan lama seharian. Sangat recommended buat yang mau tampil rapi.',
      verified: true,
    },
    {
      id: 'r2',
      author: 'Dimas P.',
      avatar: 'DP',
      rating: 4,
      date: '1 minggu lalu',
      comment: 'Worth it untuk harganya. Aroma enak dan tidak lengket di rambut. Akan beli lagi.',
      verified: true,
    },
    {
      id: 'r3',
      author: 'Fajar N.',
      avatar: 'FN',
      rating: 5,
      date: '2 minggu lalu',
      comment: 'Sudah pakai beberapa merek lain, tapi ini yang paling cocok. Hold kuat tapi tetap bisa di-restyle.',
      verified: false,
    },
  ],
};

// ---- Sales data keyed by product index (0-based) in the catalog ----
// These will be applied in order to whatever products the API returns

export const PRODUCT_SALES_DATA: ProductSalesData[] = [
  { soldCount: 342, monthlySold: 120, rating: 4.9, reviewCount: 89, isBestseller: true,  isPopular: true  },
  { soldCount: 215, monthlySold: 87,  rating: 4.7, reviewCount: 54, isBestseller: true,  isPopular: true  },
  { soldCount: 178, monthlySold: 63,  rating: 4.8, reviewCount: 41, isBestseller: false, isPopular: true  },
  { soldCount: 134, monthlySold: 45,  rating: 4.5, reviewCount: 32, isBestseller: true,  isPopular: false },
  { soldCount: 98,  monthlySold: 38,  rating: 4.6, reviewCount: 27, isBestseller: false, isPopular: false },
  { soldCount: 87,  monthlySold: 29,  rating: 4.3, reviewCount: 19, isBestseller: false, isPopular: false },
  { soldCount: 245, monthlySold: 95,  rating: 4.8, reviewCount: 67, isBestseller: true,  isPopular: true  },
  { soldCount: 63,  monthlySold: 21,  rating: 4.2, reviewCount: 14, isBestseller: false, isPopular: false },
  { soldCount: 156, monthlySold: 52,  rating: 4.6, reviewCount: 38, isBestseller: false, isPopular: false },
  { soldCount: 201, monthlySold: 74,  rating: 4.7, reviewCount: 49, isBestseller: true,  isPopular: true  },
  { soldCount: 44,  monthlySold: 15,  rating: 4.0, reviewCount: 9,  isBestseller: false, isPopular: false },
  { soldCount: 312, monthlySold: 108, rating: 4.9, reviewCount: 76, isBestseller: true,  isPopular: true  },
];

/** Get sales data for a product by its catalog index */
export function getSalesData(index: number): ProductSalesData {
  return PRODUCT_SALES_DATA[index % PRODUCT_SALES_DATA.length];
}

/** Format sold count as readable string */
export function formatSoldCount(count: number): string {
  if (count >= 1000) return `${Math.floor(count / 100) * 100}+`;
  if (count >= 100)  return `${Math.floor(count / 10) * 10}+`;
  if (count >= 50)   return `${Math.floor(count / 10) * 10}+`;
  return `${count}`;
}

/** All catalog-level dummy reviews for the sidebar */
export const CATALOG_REVIEWS: DummyReview[] = [
  {
    id: 'cr1',
    author: 'Budi S.',
    avatar: 'BS',
    rating: 5,
    date: '1 hari lalu',
    comment: 'Pilihan produk lengkap dan kualitas premium. Langsung beli 3 item sekaligus!',
    verified: true,
  },
  {
    id: 'cr2',
    author: 'Aldi R.',
    avatar: 'AR',
    rating: 5,
    date: '3 hari lalu',
    comment: 'Pengiriman cepat, produk original. Chief Supplies memang top!',
    verified: true,
  },
  {
    id: 'cr3',
    author: 'Hendra K.',
    avatar: 'HK',
    rating: 4,
    date: '5 hari lalu',
    comment: 'Pomade-nya mantap, sudah 3 bulan berlangganan. Packing aman dan rapi.',
    verified: true,
  },
  {
    id: 'cr4',
    author: 'Yoga M.',
    avatar: 'YM',
    rating: 5,
    date: '1 minggu lalu',
    comment: 'Recommend banget buat cowok yang mau tampil maksimal. Worth every penny.',
    verified: false,
  },
  {
    id: 'cr5',
    author: 'Prasetyo W.',
    avatar: 'PW',
    rating: 4,
    date: '2 minggu lalu',
    comment: 'Variannya banyak, tinggal pilih sesuai kebutuhan. Customer service juga ramah.',
    verified: true,
  },
];
