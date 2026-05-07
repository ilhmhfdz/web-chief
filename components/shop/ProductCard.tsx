'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, PackageX, Check, Star, Trophy, Flame, Lock, ArrowRight, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils/format';
import { getSalesData, formatSoldCount } from '@/lib/dummy-reviews';
import type { Product } from '@/types/product';
import type { ProductsQueryParams } from '@/types/product';
import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

// ============================================================
// Props
// ============================================================

interface ProductCardProps {
  product: Product;
  index?: number;
  sortMode?: ProductsQueryParams['sort'];
}

// ============================================================
// Subcomponents
// ============================================================

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <PackageX className="w-2.5 h-2.5" />
        Habis
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center text-[9px] font-bold text-amber-700 bg-amber-50/90 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
        Sisa {stock}
      </span>
    );
  }
  return null;
}

function CategoryBadge({ category }: { category: Product['category'] }) {
  const LABELS: Record<Product['category'], string> = {
    pomade: 'Pomade',
    shampoo: 'Shampoo',
    tools: 'Tools',
    accessories: 'Aksesoris',
  };
  return (
    <span className="bg-white/85 backdrop-blur-sm text-surface-ink text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
      {LABELS[category]}
    </span>
  );
}

function StarRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-2.5 h-2.5 ${
              i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-surface-muted text-surface-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-surface-sub font-medium">
        {rating.toFixed(1)}
        <span className="text-surface-border ml-0.5">({reviewCount})</span>
      </span>
    </div>
  );
}

function SoldBadge({ count }: { count: number }) {
  if (count < 50) return null;
  return (
    <span className="text-[10px] text-surface-sub font-medium">
      {formatSoldCount(count)} terjual
    </span>
  );
}

function TopBadge({
  isPopular,
  isBestseller,
  sortMode,
}: {
  isPopular: boolean;
  isBestseller: boolean;
  sortMode?: ProductsQueryParams['sort'];
}) {
  if (sortMode === 'popular' && isPopular) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <Flame className="w-2.5 h-2.5" /> Populer
      </span>
    );
  }
  if (sortMode === 'bestseller' && isBestseller) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <Trophy className="w-2.5 h-2.5" /> Terlaris
      </span>
    );
  }
  if (isPopular && !sortMode) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <Flame className="w-2.5 h-2.5" /> Populer
      </span>
    );
  }
  return null;
}

interface LoginPromptProps {
  callbackUrl: string;
  onDismiss: () => void;
}

function LoginPrompt({ callbackUrl, onDismiss }: LoginPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="absolute bottom-0 left-0 right-0 z-30 m-2 rounded-xl overflow-hidden shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface-ink/96 backdrop-blur-md text-white px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold leading-tight">Login diperlukan</p>
              <p className="text-[10px] text-white/55 leading-tight mt-0.5">
                Masuk untuk menambah ke keranjang
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 mt-0.5"
            aria-label="Tutup"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white text-surface-ink text-[10px] font-bold py-1.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            Masuk <ArrowRight className="w-2.5 h-2.5" />
          </Link>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex-1 flex items-center justify-center border border-white/25 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Daftar
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProductCard({ product, index = 0, sortMode }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product._id);
  const outOfStock = product.stock === 0;
  const [isJustAdded, setIsJustAdded] = useState(false);

  const sales = getSalesData(index);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (outOfStock) return;

      addItem(product);

      setIsJustAdded(true);
      setTimeout(() => setIsJustAdded(false), 1200);

      if (!inCart) {
        toast.success(
          product.name.length > 28 ? product.name.slice(0, 28) + '…' : product.name,
          { description: formatPrice(product.price), duration: 2200 }
        );
      }
    },
    [inCart, outOfStock, addItem, product]
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      className="group flex flex-col"
    >
      {/* ── Product Image ── */}
      <div className="relative block aspect-square bg-surface-raised rounded-xl overflow-hidden mb-2.5 border border-surface-muted/60 group-hover:border-surface-border transition-colors duration-300 z-0">
        <Link href={`/catalog/${product.slug}`} className="block w-full h-full">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
              outOfStock ? 'opacity-40 grayscale' : ''
            }`}
          />
        </Link>

        {/* Top-left: category + popular badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-10">
          <CategoryBadge category={product.category} />
          <TopBadge
            isPopular={sales.isPopular}
            isBestseller={sales.isBestseller}
            sortMode={sortMode}
          />
        </div>

        {/* Top-right: stock badge */}
        <div className="absolute top-2 right-2 pointer-events-none z-10">
          <StockBadge stock={product.stock} />
        </div>

        {/* ── Desktop hover overlay ── */}
        <div className="absolute inset-0 bg-surface-ink/0 group-hover:bg-surface-ink/5 transition-colors duration-300 hidden lg:block" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20 hidden lg:flex translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-[transform,opacity] duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              isJustAdded
                ? 'bg-green-600 text-white'
                : outOfStock
                ? 'bg-surface-ink/40 text-white cursor-not-allowed backdrop-blur-sm'
                : 'bg-surface-ink text-white hover:bg-surface-ink/90 shadow-lg active:scale-[0.98]'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Ditambahkan
              </>
            ) : outOfStock ? (
              'Stok Habis'
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Tambah Keranjang
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Product Info ── */}
      <div className="flex flex-col flex-1 px-0.5">
        <Link href={`/catalog/${product.slug}`}>
          <h3 className="text-[12px] sm:text-[13px] font-semibold text-surface-ink group-hover:text-surface-sub transition-colors duration-200 line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        <StarRow rating={sales.rating} reviewCount={sales.reviewCount} />

        <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
          <p className="text-[13px] font-bold text-surface-ink">
            {formatPrice(product.price)}
          </p>
          <SoldBadge count={sales.soldCount} />
        </div>

        {/* ── Mobile Add to Cart ── */}
        <div className="mt-2 lg:hidden">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={outOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${
              isJustAdded
                ? 'bg-green-600 text-white shadow-sm'
                : outOfStock
                ? 'bg-surface-raised text-surface-sub cursor-not-allowed opacity-50'
                : 'bg-surface-ink text-white hover:bg-surface-ink/85 shadow-sm'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Ditambahkan</span>
              </>
            ) : outOfStock ? (
              <span>Stok Habis</span>
            ) : (
              <>
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Keranjang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
