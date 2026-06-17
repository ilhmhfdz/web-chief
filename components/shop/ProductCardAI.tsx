'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingBag, Check, PackageX, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { getSalesData } from '@/lib/dummy-reviews';
import type { Product } from '@/types/product';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { HairAdvisorRecommendation } from '@/app/api/ai/hair-advisor/route';

// ============================================================
// Framer Motion Variants (from Context7 docs — stagger pattern)
// ============================================================

export const cardVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
  exit: { y: -16, opacity: 0, transition: { duration: 0.2 } },
};

// ============================================================
// Sub-components
// ============================================================

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

/** AI Match Score pill — pulsing gradient */
function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 88 ? 'from-emerald-500 to-teal-600' :
    score >= 75 ? 'from-amber-500 to-orange-600' :
    'from-blue-500 to-indigo-600';

  return (
    <span
      className={`inline-flex items-center gap-1 bg-gradient-to-r ${color} text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-[0.1em]`}
    >
      <Zap className="w-2.5 h-2.5" />
      {score}% Match
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

interface ProductCardAIProps {
  recommendation: HairAdvisorRecommendation;
  index?: number;
}

export default function ProductCardAI({ recommendation, index = 0 }: ProductCardAIProps) {
  const { product, reason, ai_tag, match_score } = recommendation;

  // Cast to type expected by CartContext
  const cartProduct = product as unknown as Product;
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
      addItem(cartProduct);
      setIsJustAdded(true);
      setTimeout(() => setIsJustAdded(false), 1200);
      if (!inCart) {
        toast.success(
          product.name.length > 28 ? product.name.slice(0, 28) + '…' : product.name,
          { description: formatPrice(product.price), duration: 2200 }
        );
      }
    },
    [inCart, outOfStock, addItem, cartProduct, product]
  );

  return (
    <motion.article
      variants={cardVariants}
      className="group flex flex-col bg-transparent relative"
      style={{ containerType: 'inline-size' }}
    >
      {/* ── AI Recommended Banner (top of card) ── */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#7c6b4e] uppercase tracking-[0.15em]">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Direkomendasikan AI
        </span>
        <MatchBadge score={match_score} />
      </div>

      {/* ── Image Block ── */}
      <div
        className={`relative w-full overflow-hidden mb-3 ${outOfStock ? 'opacity-60 grayscale' : ''}`}
        style={{ aspectRatio: '4/5' }}
      >
        {/* Subtle golden glow border on hover */}
        <div className="absolute inset-0 rounded-sm ring-1 ring-transparent group-hover:ring-amber-300/40 transition-all duration-500 z-20 pointer-events-none" />

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

        {/* Out of stock */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#1a1a1a] text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5">
              <PackageX className="w-3 h-3" /> Stok Habis
            </span>
          </div>
        )}

        {/* Hover overlay + Add to Cart */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300
                ${isJustAdded
                  ? 'bg-[#1a1a1a] text-white'
                  : outOfStock
                    ? 'bg-white/50 text-[#8e8b82] cursor-not-allowed'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'}`}
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
        {/* AI Reason — why this product matches */}
        <p className="text-[11px] text-[#7c6b4e] font-medium leading-snug line-clamp-2 italic mb-0.5">
          "{reason}"
        </p>

        {/* AI Tag chip */}
        <span className="inline-block text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full self-start mb-1 uppercase tracking-[0.08em]">
          {ai_tag}
        </span>

        {/* Name */}
        <Link href={`/catalog/${product.slug}`}>
          <h3 className="text-[#1a1a1a] font-bold text-[15px] leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Category */}
        <p className="text-[#8e8b82] text-[12px] leading-relaxed line-clamp-1 capitalize">
          {product.category}
        </p>

        {/* Stars + price */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col gap-1">
            <StarRow rating={sales.rating} />
            <span className="text-[#1a1a1a] font-bold text-[15px] tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>
          <Link
            href={`/catalog/${product.slug}`}
            className="text-[10px] font-bold tracking-[0.1em] text-[#8e8b82] uppercase hover:text-[#1a1a1a] transition-colors duration-200 border-b border-transparent hover:border-[#1a1a1a] pb-0.5"
          >
            Detail →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
