'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Sparkles, ChevronRight, ChevronLeft, Minus, Plus,
  CheckCircle, XCircle, Loader2, Tag, ArrowLeft,
  Star, ThumbsUp, Heart, Facebook, Twitter, Link as LinkIcon,
  ShieldCheck, Truck, ShoppingCart
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

const HAIR_TYPE_OPTIONS: { value: HairType; label: string; emoji: string }[] = [
  { value: 'straight', label: 'Lurus', emoji: '〰' },
  { value: 'wavy', label: 'Bergelombang', emoji: '〜' },
  { value: 'curly', label: 'Keriting', emoji: '◎' },
  { value: 'coily', label: 'Sangat Keriting', emoji: '●' },
  { value: 'thin', label: 'Tipis', emoji: '◡' },
  { value: 'thick', label: 'Tebal', emoji: '◉' },
  { value: 'oily', label: 'Berminyak', emoji: '◈' },
  { value: 'dry', label: 'Kering', emoji: '◇' },
];

// ============================================================
// Smart Description Renderer
// Parses plain-text descriptions into structured sections + lists
// ============================================================

function DescriptionRenderer({ text }: { text: string }) {
  // Split on common section header patterns: "Word:" or "Kata Kata:"
  // e.g. "Manfaat Produk: 1. ... 2. ..." → heading + list
  const sectionPattern = /([A-Za-zÀ-ÿ][\w\s]{1,40}:)(?=\s)/g;

  // Split text into raw tokens by detecting section headers
  const parts: { type: 'heading' | 'body'; text: string }[] = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(sectionPattern.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'body', text: text.slice(lastIndex, match.index).trim() });
    }
    parts.push({ type: 'heading', text: match[1].replace(':', '').trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'body', text: text.slice(lastIndex).trim() });
  }

  // Render a body segment: detect numbered items like "1. ... 2. ..."
  function renderBody(raw: string, key: string) {
    const numberedPattern = /(?:^|\s)(\d+)\.\s/;
    if (!numberedPattern.test(raw)) {
      return (
        <p key={key} className="text-sm text-surface-sub leading-relaxed">
          {raw}
        </p>
      );
    }
    // Split into numbered items
    const items = raw.split(/(?=(?:^|\s)\d+\.\s)/).filter(Boolean);
    return (
      <ol key={key} className="space-y-1.5 ml-1">
        {items.map((item, i) => {
          const cleaned = item.replace(/^\s*\d+\.\s*/, '').trim();
          if (!cleaned) return null;
          return (
            <li key={i} className="flex gap-2.5 text-sm text-surface-sub leading-relaxed">
              <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-surface-raised border border-surface-muted text-surface-ink text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{cleaned}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  if (parts.length === 0) {
    return <p className="text-sm text-surface-sub leading-relaxed">{text}</p>;
  }

  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (part.type === 'heading') {
      nodes.push(
        <p key={`h-${i}`} className="text-xs font-bold text-surface-ink uppercase tracking-wider mt-4 mb-1.5 first:mt-0">
          {part.text}
        </p>
      );
      i++;
    } else {
      nodes.push(renderBody(part.text, `b-${i}`));
      i++;
    }
  }

  return <div className="space-y-1.5">{nodes}</div>;
}

// ============================================================
// AI Recommendation Panel
// ============================================================

function AIRecommendationPanel({ product }: { product: Product }) {
  const [selectedHairTypes, setSelectedHairTypes] = useState<HairType[]>([]);
  const [concern, setConcern] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const toggleHairType = (type: HairType) => {
    setSelectedHairTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAsk = async () => {
    if (selectedHairTypes.length === 0) {
      setError('Pilih minimal satu tipe rambut terlebih dahulu.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);

    const hairLabels = selectedHairTypes
      .map(t => HAIR_TYPE_OPTIONS.find(o => o.value === t)?.label)
      .join(', ');

    const prompt = [
      `Saya memiliki tipe rambut: ${hairLabels}.`,
      concern ? `Masalah rambut saya: ${concern}.` : '',
      `Apakah produk "${product.name}" (kategori: ${product.category}) cocok untuk saya?`,
      `Deskripsi produk: ${product.description}`,
      `Tags: ${product.tags.join(', ')}`,
      'Berikan analisis singkat dan rekomendasi apakah saya sebaiknya memakai produk ini atau ada alternatif yang lebih cocok. Jawab dalam Bahasa Indonesia, maksimal 3 paragraf pendek.',
    ].filter(Boolean).join(' ');

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, productSlug: product.slug }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal mendapatkan rekomendasi.');
      }

      const data = await res.json();
      setResult(data.recommendation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-ink rounded flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-surface-ink text-sm">AI Hair Match</p>
            <p className="text-xs text-surface-sub">Cek apakah produk ini cocok untuk rambut Anda</p>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-surface-sub transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-surface-muted">
              {/* Hair type selector */}
              <div>
                <p className="text-xs font-semibold text-surface-sub uppercase tracking-wider mt-4 mb-2">
                  Tipe Rambut Saya
                </p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleHairType(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-all ${selectedHairTypes.includes(opt.value)
                          ? 'bg-surface-ink text-white border-surface-ink'
                          : 'bg-white text-surface-sub border-surface-muted hover:border-surface-ink'
                        }`}
                    >
                      <span>{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concern textarea */}
              <div>
                <p className="text-xs font-semibold text-surface-sub uppercase tracking-wider mb-2">
                  Masalah / Kebutuhan Rambut (opsional)
                </p>
                <textarea
                  rows={2}
                  value={concern}
                  onChange={e => setConcern(e.target.value)}
                  className="input-field resize-none text-sm"
                  placeholder="Contoh: rambut mudah patah, ingin tampilan klimis seharian..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded border border-red-100">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleAsk}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menganalisis...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Analisis Kesesuaian</>
                )}
              </button>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-surface-raised rounded border border-surface-muted space-y-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-surface-ink">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      Hasil Analisis AI
                    </div>
                    <p className="text-sm text-surface-sub leading-relaxed whitespace-pre-line">
                      {result}
                    </p>
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
// Rating Summary Row (below price)
// ============================================================

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : i < rating
                ? 'fill-amber-200 text-amber-200'
                : 'fill-surface-muted text-surface-muted'
            }`}
        />
      ))}
    </div>
  );
}

function RatingSummary({ index }: { index: number }) {
  const sales = getSalesData(index);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <StarDisplay rating={sales.rating} />
      <span className="text-sm font-bold text-surface-ink">{sales.rating.toFixed(1)}</span>
      <span className="text-sm text-surface-sub">({sales.reviewCount} ulasan)</span>
      <span className="text-surface-muted">·</span>
      <span className="text-sm text-surface-sub">{formatSoldCount(sales.soldCount)} Terjual</span>
      {sales.isBestseller && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
          🏆 Terlaris
        </span>
      )}
    </div>
  );
}

// ============================================================
// Reviews Section (full page, below product)
// ============================================================

const PRODUCT_DUMMY_REVIEWS = [
  { id: 'pr1', author: 'Rizky A.', avatar: 'RA', rating: 5, date: '2 hari lalu', comment: 'Produk bagus banget! Hasilnya natural dan tahan lama seharian. Rambut terasa lebih lembut dan bersih. Sangat recommended buat yang mau tampil rapi setiap hari.', verified: true, helpful: 14 },
  { id: 'pr2', author: 'Dimas P.', avatar: 'DP', rating: 4, date: '5 hari lalu', comment: 'Worth it untuk harganya. Aroma enak dan tidak lengket. Sudah pakai 2 botol dan hasilnya konsisten. Akan terus beli lagi!', verified: true, helpful: 9 },
  { id: 'pr3', author: 'Fajar N.', avatar: 'FN', rating: 5, date: '1 minggu lalu', comment: 'Sudah coba banyak produk lain, tapi ini yang paling cocok. Hold kuat tapi rambut tetap bisa di-restyle. Nggak bikin rambut kering.', verified: false, helpful: 7 },
  { id: 'pr4', author: 'Hendra K.', avatar: 'HK', rating: 5, date: '2 minggu lalu', comment: 'Beli karena rekomendasi barber langganan. Ternyata memang top! Packaging rapi, produk original. Pengiriman juga cepat.', verified: true, helpful: 21 },
  { id: 'pr5', author: 'Yoga M.', avatar: 'YM', rating: 4, date: '3 minggu lalu', comment: 'Cocok banget sama tipe rambut aku yang tebal. Awalnya skeptis tapi setelah coba langsung jatuh cinta. Recommended!', verified: true, helpful: 5 },
  { id: 'pr6', author: 'Aldi R.', avatar: 'AR', rating: 5, date: '1 bulan lalu', comment: 'Produk premium dengan harga yang masuk akal. Kulit kepala terasa bersih dan tidak gatal setelah pemakaian rutin 1 minggu.', verified: true, helpful: 18 },
];

const RATING_BREAKDOWN = [
  { star: 5, pct: 68 },
  { star: 4, pct: 22 },
  { star: 3, pct: 7 },
  { star: 2, pct: 2 },
  { star: 1, pct: 1 },
];

function ReviewsSection({ index }: { index: number }) {
  const sales = getSalesData(index);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  const toggleHelpful = (id: string) =>
    setHelpfulClicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section className="mt-20">
      <div className="divider mb-10" />
      <div className="mb-8">
        <p className="label-upper mb-1">Dari Pelanggan Kami</p>
        <h2 className="heading-md">Ulasan Produk</h2>
      </div>

      {/* Aggregate score card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Score big */}
        <div className="bg-surface-raised border border-surface-muted rounded-xl p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-6xl font-bold font-display text-surface-ink leading-none">{sales.rating.toFixed(1)}</p>
          <StarDisplay rating={sales.rating} size="md" />
          <p className="text-sm text-surface-sub">{sales.reviewCount} ulasan terverifikasi</p>
          <p className="text-xs text-surface-border mt-1">{formatSoldCount(sales.soldCount)} terjual</p>
        </div>

        {/* Breakdown bars */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-2.5 bg-white border border-surface-muted rounded-xl p-6">
          {RATING_BREAKDOWN.map(({ star, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 shrink-0">
                <span className="text-sm font-semibold text-surface-ink w-3">{star}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2.5 bg-surface-raised rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: (5 - star) * 0.1, ease: 'easeOut' }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
              <span className="text-sm text-surface-sub w-10 text-right shrink-0">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual review cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCT_DUMMY_REVIEWS.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="bg-white border border-surface-muted rounded-xl p-5 flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-ink text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {review.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-surface-ink">{review.author}</span>
                    {review.verified && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    )}
                  </div>
                  <span className="text-xs text-surface-border">{review.date}</span>
                </div>
              </div>
              <StarDisplay rating={review.rating} />
            </div>

            {/* Comment */}
            <p className="text-sm text-surface-sub leading-relaxed">{review.comment}</p>

            {/* Helpful */}
            <div className="flex items-center gap-2 pt-1 border-t border-surface-muted/50">
              <button
                onClick={() => toggleHelpful(review.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${helpfulClicked.has(review.id)
                    ? 'text-surface-ink'
                    : 'text-surface-border hover:text-surface-sub'
                  }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${helpfulClicked.has(review.id) ? 'fill-surface-ink' : ''}`} />
                Helpful ({review.helpful + (helpfulClicked.has(review.id) ? 1 : 0)})
              </button>
              {review.verified && (
                <span className="ml-auto text-[10px] text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Pembelian Terverifikasi
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// (Removed Custom RelatedCard)

// ============================================================
// Main Client Component
// ============================================================

export default function ProductDetailClient({ product, related }: Props) {
  const router = useRouter();
  const { addItem, isInCart, getQuantity, updateQuantity } = useCart();
  const [imgError, setImgError] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const allImages = [product.image_url, ...(product.images || [])];

  const inCart = isInCart(product._id);
  const quantity = getQuantity(product._id);
  const outOfStock = product.stock === 0;
  const [isJustAdded, setIsJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1000);
  };

  const handleBuyNow = () => {
    if (!inCart) addItem(product);
    router.push('/checkout');
  };

  const categoryLabel =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);

  return (
    <div className="section-container py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-surface-sub mb-8">
        <Link href="/" className="hover:text-surface-ink transition-colors">Beranda</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/catalog" className="hover:text-surface-ink transition-colors">Katalog</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-ink font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* ── Left: Product Image ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:sticky lg:top-24 mb-8 lg:mb-0"
        >
          <div className="flex flex-col gap-4">
            <div
              className="relative aspect-square rounded-2xl border border-surface-muted bg-surface-raised overflow-hidden shadow-sm w-full mx-auto cursor-zoom-in group"
              onClick={() => setIsLightboxOpen(true)}
            >
              {!imgError ? (
                <Image
                  src={allImages[selectedImg]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-surface-border" />
                </div>
              )}
              {/* Stock badge */}
              {outOfStock && (
                <div className="absolute top-4 left-4 bg-surface-ink text-white text-xs font-semibold px-3 py-1 rounded">
                  Stok Habis
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 justify-center w-full mx-auto overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden border-2 shrink-0 ${selectedImg === idx ? 'border-accent-dark' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Share & Favorit */}
            <div className="flex justify-center items-center gap-6 mt-2 px-2 w-full mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-sub font-medium">Share:</span>
                <div className="flex gap-2">
                  <button className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
                    <Facebook className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-full bg-sky-400 text-white flex items-center justify-center hover:scale-110 transition-transform">
                    <Twitter className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-full bg-surface-ink text-white flex items-center justify-center hover:scale-110 transition-transform">
                    <LinkIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className="w-px h-4 bg-surface-muted" />
              <button className="flex items-center gap-1.5 text-sm font-medium text-surface-sub hover:text-red-500 transition-colors group">
                <Heart className="w-5 h-5 group-hover:fill-red-500" />
                Favorit (1,1RB)
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Product Info ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header Info */}
          <div>
            <div className="flex items-start gap-2 mb-2">
              <h1 className="text-xl lg:text-2xl font-bold text-surface-ink leading-snug">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3 text-sm text-surface-sub mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-accent-dark font-bold border-b border-accent-dark leading-none">{getSalesData(0).rating.toFixed(1)}</span>
                <StarDisplay rating={getSalesData(0).rating} />
              </div>
              <span className="w-px h-3 bg-surface-muted"></span>
              <div className="flex items-center gap-1.5">
                <span className="text-surface-ink border-b border-surface-ink font-bold leading-none">{getSalesData(0).reviewCount}</span>
                <span>Penilaian</span>
              </div>
              <span className="w-px h-3 bg-surface-muted"></span>
              <div className="flex items-center gap-1.5">
                <span className="text-surface-ink font-bold leading-none">{formatSoldCount(getSalesData(0).soldCount)}</span>
                <span>Terjual</span>
              </div>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-surface-raised border border-surface-muted/50 p-4 rounded-lg flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-accent-dark font-display">
                {formatPrice(product.price)}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${outOfStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                }`}>
                {outOfStock ? 'Stok Habis' : `${product.stock} tersedia`}
              </span>
            </div>
            {getSalesData(0).isBestseller && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm w-max mt-1">
                🏆 Terlaris di {categoryLabel}
              </div>
            )}
          </div>

          {/* Info Pengiriman */}
          <div className="space-y-4 text-sm mt-4 pb-4 border-b border-surface-muted">
            <div className="flex gap-4">
              <span className="text-surface-sub w-24 shrink-0">Pengiriman</span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-surface-ink">
                  <Truck className="w-4 h-4 text-green-600" /> Garansi Tiba Besok
                </div>
                <p className="text-xs text-surface-sub">Dapatkan kompensasi jika pesanan terlambat.</p>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-surface-sub w-24 shrink-0">Jaminan</span>
              <div className="flex flex-col gap-1 font-medium text-surface-ink">
                <div className="flex items-center gap-1.5 text-surface-ink">
                  <ShieldCheck className="w-4 h-4 text-red-600" /> 15 Hari Pengembalian
                </div>
                <div className="flex items-center gap-1.5 text-surface-ink">
                  <ShieldCheck className="w-4 h-4 text-red-600" /> 100% Original & Aman
                </div>
              </div>
            </div>

            {/* Kuantitas */}
            {!outOfStock && (
              <div className="flex gap-4 items-center mt-6 pt-4">
                <span className="text-surface-sub w-24 shrink-0">Kuantitas</span>
                <div className="flex items-center">
                  <div className="flex items-center border border-surface-muted rounded overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      disabled={quantity <= 0}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface-raised transition-colors text-surface-ink disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-sm font-semibold text-surface-ink text-center border-x border-surface-muted leading-[32px]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, Math.min(quantity + 1, product.stock))}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface-raised transition-colors text-surface-ink disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-surface-sub ml-4">tersisa {product.stock} buah</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!outOfStock && (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || isJustAdded}
                className={`flex-1 py-3 px-1 flex items-center justify-center gap-1.5 font-bold transition-all rounded-lg border-2 uppercase text-[10px] sm:text-xs tracking-wider whitespace-nowrap ${
                  isJustAdded
                    ? 'bg-green-50 text-green-700 border-green-500 shadow-sm'
                    : 'bg-white text-surface-ink border-surface-ink hover:bg-surface-ink hover:text-white'
                }`}
              >
                {isJustAdded ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> 
                    <span>Dalam Keranjang</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> 
                    <span>Masukkan Keranjang</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="flex-1 py-3 px-1 flex items-center justify-center font-bold bg-accent-dark hover:bg-accent border-none text-white shadow-lg shadow-accent-dark/20 transition-all rounded-lg uppercase text-[10px] sm:text-xs tracking-wider whitespace-nowrap"
              >
                Beli Sekarang
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="divider" />

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-surface-sub uppercase tracking-wider mb-3">
              Deskripsi
            </p>
            <DescriptionRenderer text={product.description} />
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mt-4">
              <Tag className="w-3.5 h-3.5 text-surface-border" />
              {product.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded border border-surface-muted bg-surface-raised text-surface-sub font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="divider" />
          <AIRecommendationPanel product={product} />

          {/* Back to catalog */}
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm text-surface-sub hover:text-surface-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog
          </Link>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection index={0} />

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20">
          <div className="divider mb-10" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="label-upper mb-1">Kategori Serupa</p>
              <h2 className="heading-md">Produk Terkait</h2>
            </div>
            <Link href="/catalog" className="text-sm text-surface-sub hover:text-surface-ink transition-colors flex items-center gap-1">
              Lihat semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p, index) => (
              <ProductCard key={p._id} product={p} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 48px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 z-20 text-surface-sub hover:text-surface-ink transition-colors bg-white rounded-full p-1.5 shadow-md"
                onClick={() => setIsLightboxOpen(false)}
              >
                <XCircle className="w-6 h-6" />
              </button>

              {/* Product Name Header */}
              <div className="px-5 py-4 border-b border-surface-muted">
                <h3 className="text-sm font-bold text-surface-ink pr-10 leading-snug">
                  {product.name}
                </h3>
              </div>

              <div className="flex flex-col md:flex-row" style={{ height: 'min(520px, calc(100vh - 130px))' }}>
                {/* Left: Main Image */}
                <div className="relative flex-1 min-h-[260px] bg-surface-raised group">
                  <Image
                    src={allImages[selectedImg]}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    quality={100}
                  />
                  
                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImg(prev => (prev === 0 ? allImages.length - 1 : prev - 1)); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-surface-ink flex items-center justify-center rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImg(prev => (prev === allImages.length - 1 ? 0 : prev + 1)); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white text-surface-ink flex items-center justify-center rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                      {selectedImg + 1} / {allImages.length}
                    </div>
                  )}
                </div>

                {/* Right: Thumbnails (only if multiple images) */}
                {allImages.length > 1 && (
                  <div className="w-full md:w-28 flex md:flex-col flex-row gap-2 p-3 border-t md:border-t-0 md:border-l border-surface-muted bg-surface-raised overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImg(idx)}
                        className={`relative shrink-0 w-16 h-16 md:w-full md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImg === idx
                            ? 'border-accent-dark ring-2 ring-accent-dark/30'
                            : 'border-transparent opacity-60 hover:opacity-100 hover:border-surface-muted'
                        }`}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
