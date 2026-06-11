'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, ShoppingBag, Check, PackageX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { getSalesData } from '@/lib/dummy-reviews';
import type { Product } from '@/types/product';
import type { ProductsQueryParams } from '@/types/product';
import { useCallback, useState } from 'react';
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

/** Small dark pill badge top-left — "BESTSELLER" / "NEW" / "POPULER" */
function TopBadge({ isBestseller, isPopular }: { isBestseller: boolean; isPopular: boolean }) {
  if (isBestseller) {
    return (
      <span className="inline-flex items-center text-[9px] font-bold text-white bg-[#1a1a1a] px-2.5 py-1 uppercase tracking-[0.15em]">
        Bestseller
      </span>
    );
  }
  if (isPopular) {
    return (
      <span className="inline-flex items-center text-[9px] font-bold text-white bg-[#1a1a1a] px-2.5 py-1 uppercase tracking-[0.15em]">
        Populer
      </span>
    );
  }
  return null;
}

/** 5-star row — black filled stars */
function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rounded ? 'fill-[#1a1a1a] text-[#1a1a1a]' : 'fill-[#d6d2c9] text-[#d6d2c9]'}`}
        />
      ))}
    </div>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col bg-transparent"
      style={{ containerType: 'inline-size' }}
    >
      {/* ── Image Block ── */}
      <div className={`relative w-full overflow-hidden mb-4 ${outOfStock ? 'opacity-60 grayscale' : ''}`}
        style={{ aspectRatio: '4/5' }}
      >
        <Link href={`/catalog/${product.slug}`} className="block w-full h-full relative">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04]"
          />
          {product.images && product.images.length > 0 && (
            <Image
              src={product.images[0]}
              alt={`${product.name} alternate`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:opacity-100 group-hover:scale-[1.04]"
            />
          )}
        </Link>

        {/* Top-left badge */}
        <div className="absolute top-3 left-3 z-10">
          <TopBadge isBestseller={sales.isBestseller} isPopular={sales.isPopular} />
        </div>

        {/* Out of stock label */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#1a1a1a] text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5">
              <PackageX className="w-3 h-3" /> Stok Habis
            </span>
          </div>
        )}

        {/* Hover overlay — subtle dark + Add to Cart */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300
                ${isJustAdded
                  ? 'bg-[#1a1a1a] text-white'
                  : outOfStock
                    ? 'bg-white/50 text-[#8e8b82] cursor-not-allowed'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'}
              `}
            >
              {isJustAdded ? (
                <><Check className="w-3.5 h-3.5" /> Added</>
              ) : outOfStock ? (
                'Out of Stock'
              ) : (
                <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Info Below Image ── */}
      <div className="flex flex-col gap-1 px-0">
        {/* Name */}
        <Link href={`/catalog/${product.slug}`}>
          <h3 className="text-[#1a1a1a] font-bold text-[15px] leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Description / category */}
        <p className="text-[#8e8b82] text-[12px] leading-relaxed line-clamp-1 capitalize">
          {product.category}
        </p>

        {/* Stars + price + detail row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col gap-1">
            <StarRow rating={sales.rating} />
            <span className="text-[#1a1a1a] font-bold text-[15px] tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <Link
            href={`/catalog/${product.slug}`}
            className="flex items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-[#8e8b82] uppercase hover:text-[#1a1a1a] transition-colors duration-200 group/link"
          >
            Detail
            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
