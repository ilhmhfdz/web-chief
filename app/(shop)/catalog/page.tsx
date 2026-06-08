import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import Image from 'next/image';
import { Flame, Trophy, Clock, Sparkles } from 'lucide-react';
import CatalogFilters from '@/components/shop/CatalogFilters';
import CatalogSidebar from '@/components/shop/CatalogSidebar';
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
  popular: { icon: Flame, label: 'Produk Populer', description: 'Paling banyak dibeli oleh pelanggan kami', gradient: 'from-orange-500 to-red-500' },
  bestseller: { icon: Trophy, label: 'Produk Terlaris', description: 'Terlaris bulan ini di Chief Supplies', gradient: 'from-amber-500 to-yellow-400' },
  newest: { icon: Clock, label: 'Produk Terbaru', description: 'Koleksi terbaru yang baru saja hadir', gradient: 'from-blue-500 to-sky-400' },
  price_asc: { icon: Sparkles, label: 'Harga Termurah', description: 'Dari harga terendah ke tertinggi', gradient: 'from-emerald-500 to-teal-400' },
  price_desc: { icon: Sparkles, label: 'Harga Termahal', description: 'Dari harga tertinggi ke terendah', gradient: 'from-violet-500 to-purple-400' },
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

      {/* ── Catalog Hero Banner (Pro Max) ── */}
      <div className="relative overflow-hidden bg-surface border-b border-surface-muted/30">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/catalog-hero-bg.png"
            alt="perawatan pria terbaik"
            fill
            className="object-cover object-center opacity-80 mix-blend-multiply"
            priority
          />
        </div>

        {/* Gradient overlays for text readability & depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-0 pointer-events-none opacity-50" />

        <div
          className="absolute inset-0 opacity-[0.03] z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="section-container py-12 lg:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sortMeta?.gradient ?? 'from-surface-ink to-surface-sub'} flex items-center justify-center shadow-md ring-1 ring-white/10`}>
                  <SortIcon className="w-4 h-4 text-white drop-shadow-sm" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-surface-sub/80">
                  Chief Supplies
                </span>
              </div>

              {/* Main heading with fluid sizing */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-surface-ink tracking-tight leading-[1.1] mb-3">
                Katalog Produk
              </h1>
              <p className="text-base sm:text-lg text-surface-sub max-w-xl leading-relaxed">
                {pagination.total > 0
                  ? (
                    <>
                      Menjelajahi koleksi premium dari{' '}
                      <span className="font-bold text-surface-ink">{pagination.total}</span>{' '}
                      produk tersedia
                    </>
                  )
                  : 'Tidak ada produk ditemukan'}
              </p>
            </div>

            {/* Right side: active sort indicator strip (Premium glass pill) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center lg:items-end gap-3 shrink-0">
              {/* Active sort indicator strip (Premium glass pill) */}
              {sortMeta && (
                <div className="hidden sm:flex items-center gap-2.5 bg-white/80 backdrop-blur-lg border border-surface-muted/50 rounded-2xl px-4 py-2 shadow-sm ring-1 ring-black/[0.02]">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${sortMeta.gradient} flex items-center justify-center shadow-inner`}>
                    <SortIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-surface-ink uppercase tracking-wider leading-none mb-0.5">{sortMeta.label}</span>
                    <span className="text-[10px] text-surface-sub leading-none">{sortMeta.description}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Main layout: Sidebar + Content ---- */}
      <div className="section-container py-8">
        <div className="flex gap-8 items-start">

          {/* Sidebar (desktop only) */}
          <div className="hidden lg:block w-64 xl:w-68 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-8">
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
