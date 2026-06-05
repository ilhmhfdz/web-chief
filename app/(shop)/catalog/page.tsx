import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { Filter, Flame, Trophy, Clock, Sparkles } from 'lucide-react';
import CatalogFilters from '@/components/shop/CatalogFilters';
import CatalogSidebar from '@/components/shop/CatalogSidebar';
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer';
import ProductGrid from '@/components/shop/ProductGrid';
import Pagination from '@/components/shop/Pagination';
import { ProductGridSkeleton } from '@/components/shop/ProductSkeleton';
import type { ProductCategory, ProductsApiResponse, ProductsQueryParams } from '@/types/product';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import { serializeProducts } from '@/lib/db/serialize';

// ============================================================
// Metadata
// ============================================================

export const metadata: Metadata = {
  title: 'Katalog Produk | Chief Supplies',
  description: 'Jelajahi koleksi lengkap perlengkapan pria premium dari Chief Supplies — pomade, shampoo, tools & aksesori.',
};

// ============================================================
// Data fetching — runs on the server on every request
// ============================================================

async function fetchProducts(params: ProductsQueryParams): Promise<ProductsApiResponse> {
  const { page = 1, limit = 12, category, search, sort } = params;

  // Map UI-only sort values back to API-supported sort values
  let apiSort = sort;
  if (sort === 'popular' || sort === 'bestseller') {
    apiSort = 'newest'; // fallback — in production, API would support these
  }

  await dbConnect();

  // Build MongoDB filter
  const filter: Record<string, unknown> = { is_active: true };
  if (category && category !== 'all') filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Build MongoDB sort
  const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };
  const sortQuery = SORT_MAP[apiSort ?? 'newest'] ?? SORT_MAP.newest;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(48, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortQuery).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data: serializeProducts(products as any[]),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

// ============================================================
// Sort mode header info
// ============================================================

const SORT_META: Record<string, { icon: React.ElementType; label: string; description: string; gradient: string }> = {
  popular:    { icon: Flame,  label: 'Produk Populer',   description: 'Paling banyak dibeli oleh pelanggan kami', gradient: 'from-orange-500 to-red-500'     },
  bestseller: { icon: Trophy, label: 'Produk Terlaris',   description: 'Terlaris bulan ini di Chief Supplies',    gradient: 'from-amber-500 to-yellow-400'   },
  newest:     { icon: Clock,  label: 'Produk Terbaru',    description: 'Koleksi terbaru yang baru saja hadir',    gradient: 'from-blue-500 to-sky-400'       },
  price_asc:  { icon: Sparkles, label: 'Harga Termurah', description: 'Dari harga terendah ke tertinggi',        gradient: 'from-emerald-500 to-teal-400'   },
  price_desc: { icon: Sparkles, label: 'Harga Termahal', description: 'Dari harga tertinggi ke terendah',        gradient: 'from-violet-500 to-purple-400'  },
};

// ============================================================
// Page — Server Component
// ============================================================

interface CatalogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    search?: string;
    sort?: string;
    minRating?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params: ProductsQueryParams = {
    page: Number(searchParams.page ?? 1),
    limit: 12,
    category: (searchParams.category as ProductCategory) ?? 'all',
    search: searchParams.search ?? '',
    sort: (searchParams.sort as ProductsQueryParams['sort']) ?? 'popular',
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
  };

  const { data: products, pagination } = await fetchProducts(params);

  const hasActiveFilters =
    (params.category && params.category !== 'all') || !!params.search;

  const sortMeta = SORT_META[params.sort ?? 'popular'];
  const SortIcon = sortMeta?.icon ?? Flame;

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Catalog Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-surface-raised to-surface border-b border-surface-muted/60">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #1c1917 0, #1c1917 1px, transparent 0, transparent 50%)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Accent glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-accent/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="section-container py-8 lg:py-12 relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${sortMeta?.gradient ?? 'from-surface-ink to-surface-sub'} flex items-center justify-center shadow-sm`}>
                  <SortIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-surface-sub/70">
                  Chief Supplies
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-ink tracking-tight leading-tight mb-1.5">
                Katalog Produk
              </h1>
              <p className="text-sm text-surface-sub">
                {pagination.total > 0
                  ? (
                    <>
                      Menampilkan{' '}
                      <span className="font-bold text-surface-ink">{pagination.total}</span>{' '}
                      produk tersedia
                    </>
                  )
                  : 'Tidak ada produk ditemukan'}
              </p>
            </div>

            {/* Right side: active filter chip + mobile trigger */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {hasActiveFilters && (
                <div className="hidden sm:flex lg:hidden items-center gap-1.5 text-[10px] text-surface-ink bg-white border border-surface-muted shadow-sm px-3 py-1.5 rounded-full uppercase tracking-wider font-bold">
                  <Filter className="w-3 h-3" />
                  Filter aktif
                </div>
              )}
              {/* Mobile Filter Drawer Trigger */}
              <MobileFilterDrawer initialParams={params} />
            </div>
          </div>

          {/* Active sort indicator strip */}
          {sortMeta && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white border border-surface-muted/70 rounded-full px-3.5 py-1.5 shadow-sm">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${sortMeta.gradient} flex items-center justify-center`}>
                <SortIcon className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-surface-ink">{sortMeta.label}</span>
              <span className="hidden sm:inline text-[11px] text-surface-border">·</span>
              <span className="hidden sm:inline text-[11px] text-surface-sub">{sortMeta.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- Main layout: Sidebar + Content ---- */}
      <div className="section-container py-8">
        <div className="flex gap-8 items-start">

          {/* Sidebar (desktop only) */}
          <div className="hidden lg:block w-64 xl:w-68 shrink-0 sticky top-24">
            <CatalogSidebar initialParams={params} />
          </div>

          {/* Main content column */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Sort pills + search */}
            <CatalogFilters initialParams={params} />

            {/* Subtle divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-surface-muted/60 to-transparent" />

            {/* Product Grid */}
            <Suspense fallback={<ProductGridSkeleton count={12} />}>
              <ProductGrid
                products={products}
                sortMode={params.sort}
                emptyMessage={
                  hasActiveFilters
                    ? 'Tidak ada produk yang sesuai dengan filter Anda. Coba ubah pencarian.'
                    : 'Belum ada produk tersedia. Silakan kembali nanti.'
                }
              />
            </Suspense>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              currentParams={params}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
