'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Sparkles, ChevronRight, Minus, Plus,
  CheckCircle, XCircle, Loader2, ArrowLeft,
  Star, ThumbsUp, ShieldCheck, Truck, Heart,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils/format';
import { getSalesData, formatSoldCount } from '@/lib/dummy-reviews';
import type { Product } from '@/types/product';
import ProductCard from '@/components/shop/ProductCard';

// ============================================================
// Types
// ============================================================

interface Props {
  product: Product;
  related: Product[];
}

type HairType = 'straight' | 'wavy' | 'curly' | 'coily' | 'thin' | 'thick' | 'oily' | 'dry';

const HAIR_TYPE_OPTIONS: { value: HairType; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'wavy', label: 'Wavy' },
  { value: 'curly', label: 'Curly' },
  { value: 'coily', label: 'Coily' },
  { value: 'thin', label: 'Fine' },
  { value: 'thick', label: 'Thick' },
  { value: 'oily', label: 'Oily' },
  { value: 'dry', label: 'Dry' },
];

// ============================================================
// Star Display
// ============================================================

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-[#1a1a1a] text-[#1a1a1a]' : 'fill-[#d6d2c9] text-[#d6d2c9]'}`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Description Tabs
// ============================================================

function DescriptionTabs({ text }: { text: string }) {
  const [activeTab, setActiveTab] = useState(0);

  // Parse text into tabs based on common headers (e.g. "Manfaat Produk:", "Kandungan:", "Cara Pemakaian:")
  const sections: { title: string; content: string }[] = [];
  const sectionPattern = /([A-Za-zÀ-ÿ][\w\s]{2,30}:)(?=\s)/g;

  let lastIndex = 0;
  let match;
  const regex = new RegExp(sectionPattern.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({
          title: sections.length === 0 ? 'Details' : sections[sections.length - 1].title,
          content: sections.length === 0 ? content : text.slice(lastIndex, match.index).trim()
        });
      }
    }
    // Set up the next section
    sections.push({ title: match[1].replace(':', '').trim(), content: '' });
    lastIndex = match.index + match[0].length;
  }

  // Grab the last chunk
  if (lastIndex < text.length) {
    const content = text.slice(lastIndex).trim();
    if (sections.length === 0) {
      sections.push({ title: 'Details', content });
    } else {
      sections[sections.length - 1].content = content;
    }
  }

  // Clean up any empty sections and ensure 'Details' is first if there's intro text
  const validSections = sections.filter(s => s.content.trim().length > 0);
  if (validSections.length === 0) validSections.push({ title: 'Details', content: text });

  // Renderer for numbered lists
  const renderContent = (raw: string) => {
    const numberedPattern = /(?:^|\s)(\d+)\.\s/;
    if (!numberedPattern.test(raw)) {
      return <p className="text-[13px] text-[#5c5852] leading-[1.8]">{raw}</p>;
    }
    const items = raw.split(/(?=(?:^|\s)\d+\.\s)/).filter(Boolean);
    return (
      <ul className="space-y-2">
        {items.map((item, i) => {
          const cleaned = item.replace(/^\s*\d+\.\s*/, '').trim();
          if (!cleaned) return null;
          return (
            <li key={i} className="text-[13px] text-[#5c5852] leading-[1.8] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#1a1a1a]">
              {cleaned}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="border-t border-[#e8e4de] pt-2">
      <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-[#e8e4de] mb-6">
        {validSections.map((sec, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`py-3 text-[12px] font-bold tracking-wide whitespace-nowrap transition-colors relative ${
              activeTab === i ? 'text-[#1a1a1a]' : 'text-[#8e8b82] hover:text-[#1a1a1a]'
            }`}
          >
            {sec.title}
            {activeTab === i && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a1a]" />
            )}
          </button>
        ))}
      </div>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[120px]"
      >
        {renderContent(validSections[activeTab].content)}
      </motion.div>
    </div>
  );
}

// ============================================================
// AI Recommendation Panel
// ============================================================

function AIPanel({ product }: { product: Product }) {
  const [selected, setSelected] = useState<HairType[]>([]);
  const [concern, setConcern] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const toggle = (t: HairType) =>
    setSelected(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const handleAsk = async () => {
    if (!selected.length) { setError('Select at least one hair type.'); return; }
    setLoading(true); setError(''); setResult(null);
    const labels = selected.map(t => HAIR_TYPE_OPTIONS.find(o => o.value === t)?.label).join(', ');
    const prompt = [
      `Hair type: ${labels}.`,
      concern ? `Concern: ${concern}.` : '',
      `Is "${product.name}" suitable? Description: ${product.description}. Tags: ${product.tags.join(', ')}.`,
      'Give a short 2–3 paragraph recommendation in Indonesian.',
    ].filter(Boolean).join(' ');
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, productSlug: product.slug }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setResult((await res.json()).recommendation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-[#e8e4de]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-[#1a1a1a]" />
          <span className="text-[13px] font-semibold text-[#1a1a1a] tracking-wide">AI Hair Match</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-[#8e8b82] transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {HAIR_TYPE_OPTIONS.map(opt => {
                  const on = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(opt.value)}
                      className={`px-3 py-1.5 text-[11px] font-semibold border transition-all tracking-wide ${
                        on ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-white text-[#8e8b82] border-[#d6d2c9] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={2}
                value={concern}
                onChange={e => setConcern(e.target.value)}
                placeholder="Describe your hair concern (optional)…"
                className="w-full text-[13px] bg-transparent border-b border-[#d6d2c9] focus:border-[#1a1a1a] outline-none resize-none py-2 placeholder:text-[#c0bdb7] transition-colors"
              />

              {error && (
                <p className="text-[12px] text-red-500 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </p>
              )}

              <button
                onClick={handleAsk}
                disabled={loading}
                className="w-full py-3 bg-[#1a1a1a] text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing…</> : <><Sparkles className="w-3.5 h-3.5" /> Analyse Match</>}
              </button>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#f7f5f2] border border-[#e8e4de] text-[13px] text-[#5c5852] leading-[1.7] whitespace-pre-line"
                  >
                    {result}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Reviews Section
// ============================================================

const REVIEWS = [
  { id: 'r1', author: 'Rizky A.', initials: 'RA', rating: 5, date: '2 days ago', comment: 'Fantastic product. Natural look, long-lasting hold throughout the day. Highly recommend.', verified: true, helpful: 14 },
  { id: 'r2', author: 'Dimas P.', initials: 'DP', rating: 4, date: '5 days ago', comment: 'Great value. Nice scent and not sticky. Consistent results over 2 bottles.', verified: true, helpful: 9 },
  { id: 'r3', author: 'Fajar N.', initials: 'FN', rating: 5, date: '1 week ago', comment: 'Tried many products — this one is the best. Strong hold but still re-styleable.', verified: false, helpful: 7 },
  { id: 'r4', author: 'Hendra K.', initials: 'HK', rating: 5, date: '2 weeks ago', comment: 'Barber recommended it. Original packaging, fast delivery, top quality.', verified: true, helpful: 21 },
];

function ReviewsSection({ index }: { index: number }) {
  const sales = getSalesData(index);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  return (
    <section id="reviews-section" className="pt-20 border-t border-[#e8e4de]">
      <div className="mb-10">
        <p className="text-[10px] font-bold tracking-[0.25em] text-[#8e8b82] uppercase mb-3">Customer Reviews</p>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[5rem] font-light text-[#1a1a1a] leading-none">{sales.rating.toFixed(1)}</p>
            <StarDisplay rating={sales.rating} />
            <p className="text-[12px] text-[#8e8b82] mt-2">{sales.reviewCount} verified reviews</p>
          </div>
          <div className="flex-1 pb-2 space-y-2 max-w-xs">
            {[5,4,3,2,1].map(s => {
              const pct = s === 5 ? 68 : s === 4 ? 22 : s === 3 ? 7 : s === 2 ? 2 : 1;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#8e8b82] w-2">{s}</span>
                  <div className="flex-1 h-1 bg-[#e8e4de] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: (5-s)*0.08, ease: 'easeOut' }}
                      className="h-full bg-[#1a1a1a]"
                    />
                  </div>
                  <span className="text-[11px] text-[#8e8b82] w-7 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="border-b border-[#e8e4de] pb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1a1a1a] text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0">
                  {r.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{r.author}</p>
                  <p className="text-[11px] text-[#8e8b82]">{r.date}</p>
                </div>
              </div>
              <StarDisplay rating={r.rating} />
            </div>
            <p className="text-[13px] text-[#5c5852] leading-[1.7]">{r.comment}</p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => setLiked(p => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                className={`flex items-center gap-1.5 text-[11px] transition-colors ${liked.has(r.id) ? 'text-[#1a1a1a]' : 'text-[#8e8b82] hover:text-[#1a1a1a]'}`}
              >
                <ThumbsUp className={`w-3 h-3 ${liked.has(r.id) ? 'fill-current' : ''}`} />
                Helpful ({r.helpful + (liked.has(r.id) ? 1 : 0)})
              </button>
              {r.verified && (
                <span className="ml-auto text-[10px] text-[#8e8b82] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> Verified
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Main Client Component
// ============================================================

export default function ProductDetailClient({ product, related }: Props) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const [selectedImg, setSelectedImg] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);

  const allImages = [product.image_url, ...(product.images || [])];
  const inCart = isInCart(product._id);
  const outOfStock = product.stock === 0;
  const sales = getSalesData(0);
  const categoryLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1);

  const handleAddToCart = () => {
    addItem(product);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (!inCart) addItem(product);
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Breadcrumb ── */}
      <nav className="hidden lg:flex items-center gap-2 text-[11px] text-[#8e8b82] px-8 md:px-16 pt-8 pb-0 max-w-[1400px] mx-auto">
        <Link href="/" className="hover:text-[#1a1a1a] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-[#1a1a1a] transition-colors">Products</Link>
        <span>/</span>
        <span className="text-[#1a1a1a] font-medium truncate max-w-[260px]">{product.name}</span>
      </nav>

      {/* ── Mobile back button ── */}
      <div className="lg:hidden flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[12px] text-[#8e8b82] hover:text-[#1a1a1a] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* ── Main Grid ── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row lg:gap-16 xl:gap-24">

          {/* ══ LEFT: Image Gallery ══ */}
          <div className="lg:w-[55%] xl:w-[58%] shrink-0 relative">
            <div className="lg:sticky lg:top-24">
              {/* Desktop: thumbnail rail + main image */}
            <div className="hidden lg:flex gap-4">
              {/* Thumbnail Rail */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-3 shrink-0">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`w-16 h-16 relative overflow-hidden transition-all duration-200 ${selectedImg === i ? 'ring-1 ring-[#1a1a1a]' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <Image src={img} alt={`${product.name} ${i+1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1 relative overflow-hidden bg-white" style={{ aspectRatio: '4/5' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={allImages[selectedImg]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-contain p-8 mix-blend-multiply"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {outOfStock && (
                  <div className="absolute top-4 left-4 bg-[#1a1a1a] text-white text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5">
                    Out of Stock
                  </div>
                )}
                {sales.isBestseller && !outOfStock && (
                  <div className="absolute top-4 left-4 bg-[#1a1a1a] text-white text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5">
                    Bestseller
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: horizontal scroll gallery */}
            <div className="lg:hidden">
              <div className="relative overflow-hidden bg-white" style={{ aspectRatio: '1/1' }}>
                <Image
                  src={allImages[selectedImg]}
                  alt={product.name}
                  fill
                  className="object-contain p-6 mix-blend-multiply"
                  priority
                />
                {outOfStock && (
                  <div className="absolute top-3 left-3 bg-[#1a1a1a] text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1">
                    Out of Stock
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 pt-3 overflow-x-auto no-scrollbar">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`w-14 h-14 relative shrink-0 overflow-hidden transition-all ${selectedImg === i ? 'ring-1 ring-[#1a1a1a]' : 'opacity-50'}`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* ══ RIGHT: Product Info ══ */}
          <div className="flex-1 min-w-0 pt-8 lg:pt-0">

            {/* Category */}
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#8e8b82] uppercase mb-4">{categoryLabel}</p>

            {/* Name */}
            <h1 className="text-[1.8rem] lg:text-[2.2rem] font-bold text-[#1a1a1a] leading-[1.15] tracking-tight mb-4">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-6">
              <StarDisplay rating={sales.rating} />
              <span className="text-[12px] text-[#8e8b82]">{sales.rating.toFixed(1)} ({sales.reviewCount} reviews)</span>
              <span className="text-[#d6d2c9]">·</span>
              <span className="text-[12px] text-[#8e8b82]">{formatSoldCount(sales.soldCount)} sold</span>
            </div>

            {/* Price */}
            <div className="mb-10">
              <p className="text-[2rem] font-light text-[#1a1a1a] tracking-tight">{formatPrice(product.price)}</p>
              <p className={`text-[11px] mt-1 ${outOfStock ? 'text-red-500' : 'text-[#8e8b82]'}`}>
                {outOfStock ? 'Currently out of stock' : `${product.stock} units available`}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 mb-10">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`w-full py-4 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 border
                  ${isJustAdded
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : outOfStock
                    ? 'bg-white text-[#c0bdb7] border-[#e8e4de] cursor-not-allowed'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
              >
                {isJustAdded ? '✓ Added to Cart' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {!outOfStock && (
                <button
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-[#1a1a1a] text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-black transition-colors"
                >
                  Buy Now
                </button>
              )}
            </div>

            {/* Trust badges (bbhugme style grid) */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-10 pb-6 border-b border-[#e8e4de]">
              {[
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'Expert-developed' },
                { icon: <Truck className="w-5 h-5" />, label: 'Fast Delivery' },
                { icon: <CheckCircle className="w-5 h-5" />, label: '100% Original' },
                { icon: <Star className="w-5 h-5" />, label: 'Premium Quality' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-[#8e8b82] shrink-0">{b.icon}</div>
                  <span className="text-[11px] font-semibold text-[#5c5852] tracking-wide leading-tight">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Description Tabs */}
            <DescriptionTabs text={product.description} />

            {/* Product Tags */}
            {product.tags?.length > 0 && (
              <div className="mt-8 mb-4 flex flex-wrap gap-2">
                {product.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="text-[10px] text-[#8e8b82] border border-[#e8e4de] px-2.5 py-1 tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI Panel */}
            <div className="mt-8">
              <AIPanel product={product} />
            </div>

          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="mt-24">
          <ReviewsSection index={0} />
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section id="related-section" className="mt-24 pt-12 border-t border-[#e8e4de]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#8e8b82] uppercase mb-3">You May Also Like</p>
                <h2 className="text-[2rem] font-bold text-[#1a1a1a] leading-none tracking-tight">
                  More from {categoryLabel}
                </h2>
              </div>
              <Link href={`/catalog?category=${product.category}`} className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#8e8b82] hover:text-[#1a1a1a] transition-colors border-b border-[#d6d2c9] pb-0.5">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {related.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
