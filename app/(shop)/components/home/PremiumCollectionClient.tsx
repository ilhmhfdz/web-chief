'use client';

/**
 * PremiumCollectionClient
 * ─────────────────────────────────────────────────────────────────────────────
 * Client component yang menggabungkan section "Premium Collection" dengan
 * AI Hair Advisor form — embedded langsung di header section, bukan section
 * terpisah. Design: premium minimalist, inline single-bar input.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Send, RotateCcw, Loader2,
  Star, ShoppingBag, Check, PackageX, Zap, AlertCircle
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { getSalesData } from '@/lib/dummy-reviews';
import type { Product } from '@/types/product';
import type { HairAdvisorRecommendation } from '@/app/api/ai/hair-advisor/route';
import { toast } from 'sonner';

// ── Quick-fill condition chips ────────────────────────────────────────────────
const CHIPS = [
  { label: 'Oily Scalp', value: 'My hair gets oily and feels greasy after just one day' },
  { label: 'Dandruff', value: 'I have persistent dandruff and an itchy, flaky scalp' },
  { label: 'Dry & Brittle', value: 'My hair is dry, brittle, and hard to manage after washing' },
  { label: 'Hair Loss', value: 'I experience excessive hair loss when washing or combing' },
  { label: 'Frizzy & Coarse', value: 'My hair is coarse, frizzy, and difficult to style with regular pomade' },
];

// ── Framer variants ────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.08, staggerChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
  exit: { y: -10, opacity: 0, transition: { duration: 0.15 } },
};

type UIState = 'idle' | 'loading' | 'results' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Sub: Regular ProductCard (reuse inline to avoid extra import)
// ─────────────────────────────────────────────────────────────────────────────
function ProductCardRegular({ product, index }: { product: Product; index: number }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product._id);
  const outOfStock = product.stock === 0;
  const [isJustAdded, setIsJustAdded] = useState(false);
  const sales = getSalesData(index);

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
    if (!inCart) toast.success(product.name.slice(0, 28), { description: formatPrice(product.price), duration: 2000 });
  }, [inCart, outOfStock, addItem, product]);

  return (
    <motion.article variants={cardVariants} className="group flex flex-col">
      <div className={`relative w-full overflow-hidden mb-4 ${outOfStock ? 'opacity-60 grayscale' : ''}`} style={{ aspectRatio: '4/5' }}>
        <Link href={`/catalog/${product.slug}`} className="block w-full h-full relative">
          <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          {product.images?.[0] && <Image src={product.images[0]} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.04]" />}
        </Link>
        {outOfStock && <div className="absolute inset-0 flex items-center justify-center z-10"><span className="bg-white/90 text-[#1a1a1a] text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 flex items-center gap-1.5"><PackageX className="w-3 h-3" /> Stok Habis</span></div>}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
            <button onClick={handleAdd} disabled={outOfStock} className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${isJustAdded ? 'bg-[#1a1a1a] text-white' : outOfStock ? 'bg-white/50 text-[#8e8b82] cursor-not-allowed' : 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'}`}>
              {isJustAdded ? <><Check className="w-3.5 h-3.5" /> Added</> : outOfStock ? 'Out of Stock' : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Link href={`/catalog/${product.slug}`}><h3 className="text-[#1a1a1a] font-bold text-[15px] leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity">{product.name}</h3></Link>
        <p className="text-[#8e8b82] text-[12px] capitalize">{product.category}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(sales.rating) ? 'fill-[#1a1a1a] text-[#1a1a1a]' : 'fill-[#d6d2c9] text-[#d6d2c9]'}`} />)}</div>
            <span className="text-[#1a1a1a] font-bold text-[15px]">{formatPrice(product.price)}</span>
          </div>
          <Link href={`/catalog/${product.slug}`} className="text-[11px] font-bold text-[#8e8b82] uppercase tracking-[0.1em] hover:text-[#1a1a1a] transition-colors flex items-center gap-1">Detail <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub: AI ProductCard
// ─────────────────────────────────────────────────────────────────────────────
function ProductCardAI({ rec, index }: { rec: HairAdvisorRecommendation; index: number }) {
  const { addItem, isInCart } = useCart();
  const p = rec.product as unknown as Product;
  const inCart = isInCart(p._id);
  const outOfStock = p.stock === 0;
  const [isJustAdded, setIsJustAdded] = useState(false);
  const sales = getSalesData(index);

  const scoreColor = 'bg-[#1a1a1a]';

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (outOfStock) return;
    addItem(p);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
    if (!inCart) toast.success(p.name.slice(0, 28), { description: formatPrice(p.price), duration: 2000 });
  }, [inCart, outOfStock, addItem, p]);

  return (
    <motion.article variants={cardVariants} className="group flex flex-col">
      {/* AI badge row */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-[0.12em]">
          <Sparkles className="w-2.5 h-2.5" /> AI Pick
        </span>
        <span className={`flex items-center gap-1 ${scoreColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full`}>
          <Zap className="w-2 h-2" />{rec.match_score}%
        </span>
      </div>

      {/* Image */}
      <div className={`relative w-full overflow-hidden mb-3 ${outOfStock ? 'opacity-60 grayscale' : ''}`} style={{ aspectRatio: '4/5' }}>
        {/* Golden ring on hover */}
        <div className="absolute inset-0 z-20 pointer-events-none ring-1 ring-transparent group-hover:ring-amber-300/50 transition-all duration-500" />
        <Link href={`/catalog/${rec.product.slug}`} className="block w-full h-full relative">
          <Image src={rec.product.image_url} alt={rec.product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          {rec.product.images?.[0] && <Image src={rec.product.images[0]} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.04]" />}
        </Link>
        {outOfStock && <div className="absolute inset-0 flex items-center justify-center z-10"><span className="bg-white/90 text-[10px] font-bold px-3 py-1.5 flex items-center gap-1.5"><PackageX className="w-3 h-3" /> Stok Habis</span></div>}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
            <button onClick={handleAdd} disabled={outOfStock} className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${isJustAdded ? 'bg-[#1a1a1a] text-white' : outOfStock ? 'bg-white/50 text-[#8e8b82] cursor-not-allowed' : 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'}`}>
              {isJustAdded ? <><Check className="w-3.5 h-3.5" /> Added</> : outOfStock ? 'Out of Stock' : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
            </button>
          </div>
        </div>
      </div>

      {/* AI reason - Premium Minimalist */}
      <div className="mb-3 pt-3 border-t border-[#e8e4dc]">
        <span className="block text-[9px] font-bold text-[#1a1a1a] uppercase tracking-[0.15em] mb-1.5">{rec.ai_tag}</span>
        <p className="text-[11px] text-[#8e8b82] leading-relaxed line-clamp-2">{rec.reason}</p>
      </div>

      {/* Name + price */}
      <Link href={`/catalog/${rec.product.slug}`}><h3 className="text-[#1a1a1a] font-bold text-[15px] leading-snug line-clamp-1 group-hover:opacity-70 transition-opacity">{rec.product.name}</h3></Link>
      <p className="text-[#8e8b82] text-[12px] capitalize">{rec.product.category}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col gap-1">
          <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(sales.rating) ? 'fill-[#1a1a1a] text-[#1a1a1a]' : 'fill-[#d6d2c9] text-[#d6d2c9]'}`} />)}</div>
          <span className="text-[#1a1a1a] font-bold text-[15px]">{formatPrice(rec.product.price)}</span>
        </div>
        <Link href={`/catalog/${rec.product.slug}`} className="text-[11px] font-bold text-[#8e8b82] uppercase tracking-[0.1em] hover:text-[#1a1a1a] transition-colors flex items-center gap-1">Detail <ArrowRight className="w-3 h-3" /></Link>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  initialProducts: Product[];
}

export default function PremiumCollectionClient({ initialProducts }: Props) {
  const [condition, setCondition] = useState('');
  const [uiState, setUiState] = useState<UIState>('idle');
  const [recommendations, setRecommendations] = useState<HairAdvisorRecommendation[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAIMode = uiState === 'results' && recommendations.length > 0;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = condition.trim();
    if (!trimmed || trimmed.length < 5) return;

    setUiState('loading');
    setRecommendations([]);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/hair-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Gagal menganalisis.'); setUiState('error'); return; }
      if (!data.recommendations?.length) { setUiState('idle'); return; }
      setRecommendations(data.recommendations);
      setUiState('results');
    } catch {
      setErrorMsg('Koneksi gagal. Coba lagi.');
      setUiState('error');
    }
  }, [condition]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setCondition('');
    setUiState('idle');
    setRecommendations([]);
    setErrorMsg('');
    setActiveChip(null);
    inputRef.current?.focus();
  }, []);

  // ── Chip ────────────────────────────────────────────────────────────────────
  const handleChip = useCallback((chip: typeof CHIPS[0]) => {
    setCondition(chip.value);
    setActiveChip(chip.label);
    inputRef.current?.focus();
  }, []);

  // ── Enter key ───────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  }, [handleSubmit]);

  return (
    <section id="premium-collection" className="section-container py-24 lg:py-32" aria-label="Premium Collection with AI Hair Advisor">

      {/* ── Header Row ── */}
      <div className="flex items-end justify-between mb-10">
        <div className="leading-none">
          <h2 className="text-[3.5rem] lg:text-[5rem] font-bold text-[#1a1a1a] leading-none tracking-tight">Premium</h2>
          <h2 className="text-[3.5rem] lg:text-[5rem] font-bold text-[#c0bdb7] leading-none tracking-tight -mt-2">Collection</h2>
          <p className="mt-6 max-w-xl text-[#8e8b82] text-sm sm:text-base leading-relaxed tracking-wide font-medium">
            Grooming, elevated. Chief Barber &amp; Supplies' exclusive collection is crafted to deliver flawless results — from root to tip, morning to night.
          </p>
        </div>
        <Link
          href="/catalog"
          className="hidden sm:flex items-center px-6 py-3 border border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors duration-300 mb-2"
        >
          View All
        </Link>
      </div>

      {/* ── AI Divider line ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-[#e8e4dc]" />
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#a09b93] uppercase tracking-[0.25em]">
          <Sparkles className="w-3 h-3 text-amber-400" />
          AI Hair Advisor
        </span>
        <div className="h-px flex-1 bg-[#e8e4dc]" />
      </div>

      {/* ── Premium Inline Search Bar ── */}
      <div className="mb-5">
        <div
          className={`
            flex items-center gap-0 border transition-all duration-300
            ${uiState === 'loading'
              ? 'border-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.1)]'
              : 'border-[#d6d2c9] focus-within:border-[#1a1a1a] focus-within:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]'
            }
          `}
        >
          {/* Input */}
          <input
            ref={inputRef}
            id="hair-condition-input"
            type="text"
            value={condition}
            onChange={e => setCondition(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={uiState === 'loading'}
            maxLength={300}
            placeholder="Describe your hair concern… (e.g. oily scalp, dandruff, hair loss)"
            className="flex-1 bg-transparent px-5 py-4 text-[14px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none disabled:opacity-50 font-medium tracking-wide min-w-0"
            aria-label="Hair condition"
            autoComplete="off"
          />

          {/* Reset — shown when has value */}
          <AnimatePresence>
            {condition && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                onClick={handleReset}
                className="px-3 text-[#b5b0a8] hover:text-[#1a1a1a] transition-colors"
                aria-label="Hapus"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button
            id="hair-advisor-submit"
            onClick={handleSubmit}
            disabled={!condition.trim() || condition.trim().length < 5 || uiState === 'loading'}
            className={`
              flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[11px] font-bold tracking-[0.15em] uppercase
              transition-all duration-300 border-l
              ${uiState === 'loading'
                ? 'bg-amber-50 text-amber-600 border-amber-200 cursor-wait'
                : !condition.trim() || condition.trim().length < 5
                  ? 'bg-[#f5f2ed] text-[#b5b0a8] border-[#d6d2c9] cursor-not-allowed'
                  : 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-[#333] active:scale-[0.98]'
              }
            `}
            aria-label="Find recommended products"
          >
            {uiState === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {uiState === 'loading' ? 'Analysing…' : 'Find'}
            </span>
          </button>
        </div>

        {/* Error message inline */}
        <AnimatePresence>
          {uiState === 'error' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-4 py-2.5 mt-2 bg-red-50 border border-red-200"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[11px] text-red-600 flex-1">{errorMsg}</p>
              <button onClick={handleSubmit} className="text-[11px] font-bold text-red-700 underline hover:no-underline">Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chip Suggestions ── */}
      <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Quick-select hair concerns">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            id={`chip-${chip.label.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => handleChip(chip)}
            disabled={uiState === 'loading'}
            className={`
              text-[10px] font-bold px-3.5 py-1.5 border tracking-[0.1em] uppercase
              transition-all duration-200 rounded-full
              disabled:opacity-40 disabled:cursor-not-allowed
              ${activeChip === chip.label
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-transparent text-[#8e8b82] border-[#d6d2c9] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
              }
            `}
          >
            {chip.label}
          </button>
        ))}

        {/* Reset AI mode */}
        <AnimatePresence>
          {isAIMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleReset}
              className="text-[10px] font-bold px-3.5 py-1.5 border border-dashed border-[#d6d2c9] text-[#8e8b82] tracking-[0.1em] uppercase rounded-full hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all duration-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-2.5 h-2.5" /> View All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Product Grid — AI or Default ── */}
      <AnimatePresence mode="wait">

        {/* Loading skeleton */}
        {uiState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* AI thinking bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
              <p className="text-[12px] text-[#8e8b82] font-medium">
                Our AI is matching the finest products to your hair profile…
              </p>
            </div>
            {/* Skeletons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="h-2.5 w-20 bg-[#ede9e3] rounded-full" />
                  <div className="aspect-[4/5] bg-[#ede9e3]" />
                  <div className="h-2.5 w-full bg-[#ede9e3] rounded-full" />
                  <div className="h-2.5 w-2/3 bg-[#ede9e3] rounded-full" />
                  <div className="h-4 w-full bg-[#ede9e3] rounded-full" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Results */}
        {uiState === 'results' && recommendations.length > 0 && (
          <motion.div
            key="ai-results"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            {/* Results label */}
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[11px] text-[#8e8b82] uppercase tracking-[0.2em] font-bold">
                {recommendations.length} {recommendations.length === 1 ? 'Product' : 'Products'} Curated for You
              </p>
              <span className="text-[11px] text-[#b5b0a8] italic normal-case tracking-normal">
                — "{condition.slice(0, 60)}{condition.length > 60 ? '…' : ''}"
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {recommendations.map((rec, i) => (
                <ProductCardAI key={rec.product._id} rec={rec} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Default featured products */}
        {(uiState === 'idle' || uiState === 'error') && (
          <motion.div
            key="default"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {initialProducts.map((product, index) => (
                <ProductCardRegular key={product._id} product={product} index={index} />
              ))}
            </div>
            <div className="mt-12 sm:hidden text-center">
              <Link href="/catalog" className="btn-outline text-sm w-full">View All Products</Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
