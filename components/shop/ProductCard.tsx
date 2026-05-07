'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, PackageX, Check, Star, Trophy, Flame, Lock, ArrowRight, X } from 'lucide-react';
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
  /** Animation delay for staggered grid entry */
  index?: number;
  /** Current sort mode to decide which extra badge to show */
  sortMode?: ProductsQueryParams['sort'];
}

// ============================================================
// Subcomponents
// ============================================================

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
        <PackageX className="w-3 h-3" />
        Habis
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold text-accent-dark bg-white/90 backdrop-blur-sm border border-accent-dark/20 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
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
    <span className="bg-white/90 backdrop-blur-sm text-surface-ink text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider border border-surface-muted shadow-sm">
      {LABELS[category]}
    </span>
  );
}

/** Mini star rating row */
function StarRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-surface-muted text-surface-muted'
              }`}
          />
        ))}
      </div>
      <span className="text-[11px] text-surface-sub font-medium">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

/** "200+ Terjual" badge */
function SoldBadge({ count }: { count: number }) {
  if (count < 50) return null;
  return (
    <span className="text-[10px] text-surface-sub font-medium">
      {formatSoldCount(count)} Terjual
    </span>
  );
}

/** "Terlaris — 100+/bln" shown in bestseller mode */
function BestsellerLabel({ monthlySold }: { monthlySold: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
      <Trophy className="w-2.5 h-2.5" />
      {monthlySold}+ terjual/bln
    </span>
  );
}

/** Floating top badge for popular / bestseller */
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-orange-500 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
        <Flame className="w-3 h-3" /> Populer
      </span>
    );
  }
  if (sortMode === 'bestseller' && isBestseller) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-amber-500 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
        <Trophy className="w-3 h-3" /> Terlaris
      </span>
    );
  }
  if (isPopular && !sortMode) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-orange-500 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
        <Flame className="w-3 h-3" /> Populer
      </span>
    );
  }
  return null;
}
// Auth Login Prompt — shown inline when user is not logged in


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
      className="absolute bottom-0 left-0 right-0 z-30 m-2.5 rounded-md overflow-hidden shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Glassmorphism card */}
      <div className="bg-surface-ink/95 backdrop-blur-md text-white px-4 py-3.5 flex flex-col gap-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-bold leading-tight">Login diperlukan</p>
              <p className="text-[10px] text-white/60 leading-tight mt-0.5">
                Masuk untuk menambah ke keranjang
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 mt-0.5"
            aria-label="Tutup"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* CTA row */}
        <div className="flex gap-2">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white text-surface-ink text-[11px] font-bold py-2 rounded-sm hover:bg-white/90 transition-colors"
          >
            Masuk Sekarang
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex-1 flex items-center justify-center gap-1.5 border border-white/30 text-white text-[11px] font-bold py-2 rounded-sm hover:bg-white/10 transition-colors"
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

  // Attach dummy sales data by catalog index
  const sales = getSalesData(index);

  /** Unified handler for both desktop overlay and mobile button */
  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (outOfStock) return;

      addItem(product);
      
      // Temporary success state for 1 second
      setIsJustAdded(true);
      setTimeout(() => setIsJustAdded(false), 1000);

      // IMP-014: Toast notification on successful add to cart (optional, keeping for safety)
      if (!inCart) {
        toast.success(`${product.name.length > 30 ? product.name.slice(0, 30) + '…' : product.name} ditambahkan`, {
          description: formatPrice(product.price),
          duration: 2500,
        });
      }
    },
    [inCart, outOfStock, addItem, product]
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="group bg-white flex flex-col transition-all duration-300"
    >
      {/* Product Image */}
      <div className="relative block aspect-[4/5] bg-surface-raised mb-3 rounded-sm border border-surface-muted group-hover:border-surface-border transition-colors z-0">
        <Link href={`/catalog/${product.slug}`} className="block w-full h-full">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover rounded-sm transition-transform duration-700 group-hover:scale-105 ${outOfStock ? 'opacity-50 grayscale' : ''
              }`}
          />
        </Link>

        {/* Top-left: category + popular/bestseller badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none z-10">
          <div className="flex items-start gap-1.5 flex-wrap">
            <CategoryBadge category={product.category} />
          </div>
          <TopBadge
            isPopular={sales.isPopular}
            isBestseller={sales.isBestseller}
            sortMode={sortMode}
          />
        </div>

        {/* Top-right: stock badge */}
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <StockBadge stock={product.stock} />
        </div>

        {/* ── Hover Add-to-Cart Overlay (Desktop) ── */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 hidden lg:flex translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-[transform,opacity] duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isJustAdded
                  ? 'bg-green-600 text-white scale-[1.02]'
                  : outOfStock
                    ? 'bg-surface-ink/50 text-white cursor-not-allowed backdrop-blur-sm'
                    : 'bg-surface-ink text-white hover:bg-surface-ink/90 shadow-lg active:scale-95'
              }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4" />
                Berhasil Ditambahkan
              </>
            ) : outOfStock ? (
              'Stok Habis'
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Tambah ke Keranjang
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 px-1">
        <Link href={`/catalog/${product.slug}`}>
          <h3 className="text-sm font-semibold text-surface-ink group-hover:text-surface-sub transition-colors duration-200 line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <StarRow rating={sales.rating} reviewCount={sales.reviewCount} />

        {/* Price + Sold */}
        <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
          <p className="text-sm font-bold text-surface-ink">
            {formatPrice(product.price)}
          </p>
          <SoldBadge count={sales.soldCount} />
        </div>

        {/* Terlaris monthly sold label (shown only in bestseller mode) */}
        {(sortMode === 'bestseller' || sortMode === undefined) && sales.isBestseller && (
          <div className="mt-1.5">
            <BestsellerLabel monthlySold={sales.monthlySold} />
          </div>
        )}

        {/* ── Mobile Add to Cart ── */}
        <div className="mt-auto pt-3 lg:hidden">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-[11px] font-black uppercase tracking-[0.05em] transition-all duration-300 active:scale-90 ${
              isJustAdded
                ? 'bg-green-50 text-green-700 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                : outOfStock
                  ? 'bg-surface-raised text-surface-sub border-surface-muted cursor-not-allowed opacity-50'
                  : 'bg-white text-surface-ink border-surface-ink shadow-sm hover:bg-surface-ink hover:text-white'
            }`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Dalam Keranjang</span>
              </>
            ) : outOfStock ? (
              <span>Stok Habis</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah Keranjang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
