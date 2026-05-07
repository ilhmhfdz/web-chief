import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Star, Users, Package, Zap } from 'lucide-react';
import type { Product } from '@/types/product';
import ProductCard from '@/components/shop/ProductCard';

export const metadata: Metadata = {
  title: 'Chief Supplies — Perlengkapan Pria Premium',
  description: 'Temukan perlengkapan grooming terbaik untuk pria modern. Dipersonalisasi oleh AI berdasarkan bentuk wajah Anda.',
};

// ─── Data ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Recommendation',
    desc: 'Rekomendasi produk personal berdasarkan analisis bentuk wajah Anda secara real-time.',
    badge: 'Teknologi Terbaru',
    color: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Produk Original',
    desc: '100% produk original bergaransi resmi dari brand grooming terpilih.',
    badge: 'Bergaransi',
    color: 'bg-green-50 border-green-100',
    iconColor: 'text-green-600',
  },
  {
    icon: Truck,
    title: 'Pengiriman Cepat',
    desc: 'Same-day delivery untuk area Jakarta. Seluruh Indonesia dalam 2–3 hari kerja.',
    badge: 'Same-Day Jakarta',
    color: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
];

const SOCIAL_PROOF = [
  { icon: Users, value: '2.000+', label: 'Pelanggan Puas' },
  { icon: Package, value: '50+', label: 'Produk Premium' },
  { icon: Star, value: '4.8★', label: 'Rating Rata-rata' },
  { icon: Zap, value: '1 Hari', label: 'Proses Pesanan' },
];

// ─── Data Fetching ─────────────────────────────────────────────

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/products?limit=4&sort=newest`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ─── Skeleton ─────────────────────────────────────────────────

function FeaturedProductsSkeleton() {
  return (
    <section className="section-container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="h-3 w-24 bg-surface-muted rounded animate-pulse mb-3" />
          <div className="h-8 w-40 bg-surface-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-28 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Products Async Component ────────────────────────
// Uses the same ProductCard as catalog for consistency (main request)

async function FeaturedProducts() {
  const featured = await getFeaturedProducts();
  if (featured.length === 0) return null;

  return (
    <section className="section-container py-16 lg:py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="label-upper mb-2">Koleksi Terbaru</p>
          <h2 className="heading-lg">Produk Pilihan</h2>
        </div>
        <Link href="/catalog" className="btn-ghost text-sm hidden sm:flex">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Same grid layout as catalog, using identical ProductCard component */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
        {featured.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} />
        ))}
      </div>

      <div className="mt-8 sm:hidden text-center">
        <Link href="/catalog" className="btn-secondary text-sm">
          Lihat Semua Produk <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function HomePage() {
  return (
    <main>

      {/* ─── Hero ─── */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        {/* Full width background image covering from left text to right cards */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src="/images/landing_page.png"
            alt="Chief Background"
            fill
            className="object-cover object-center opacity-60 mix-blend-multiply"
            priority
            quality={90}
          />
          {/* Gradient to ensure text readability on left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>

        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 bg-surface-raised border border-surface-muted rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-surface-sub">Dipercaya 2.000+ pria Indonesia</span>
              </div>

              <h1 className="heading-xl mb-5 text-balance leading-[1.1]">
                Gaya Terbaik<br />
                <span className="italic text-accent">untuk Pria Modern.</span>
              </h1>

              <p className="text-lg text-surface-sub leading-relaxed max-w-xl mb-8">
                Temukan perlengkapan grooming premium yang dipersonalisasi AI
                sesuai bentuk wajah Anda. Tampil percaya diri setiap hari.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap mb-10">
                <Link href="/catalog" className="btn-primary">
                  Jelajahi Katalog <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/ai-recommendation" className="btn-secondary">
                  <Sparkles className="w-4 h-4" />
                  Coba AI Recommendation
                </Link>
              </div>

              {/* Social proof stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SOCIAL_PROOF.map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="font-display text-xl font-bold text-surface-ink">{s.value}</p>
                    <p className="text-xs text-surface-sub mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual card stack */}
            <div className="hidden lg:flex relative items-center justify-center min-h-[480px]">
              {/* Feature cards stacked */}
              <div className="relative space-y-3 w-full max-w-md ml-auto z-10">
                {/* Card 1 — AI */}
                <div className="glass-card p-5 flex items-center gap-4 shadow-lg shadow-black/5">
                  <div className="w-12 h-12 rounded-xl bg-surface-ink flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-ink text-sm">AI Face Analysis</p>
                    <p className="text-xs text-surface-sub mt-0.5">Hairstyle recommendation berdasarkan bentuk wajah Anda</p>
                  </div>
                </div>

                {/* Card 2 — Products */}
                <div className="glass-card p-5 ml-6 flex items-center gap-4 shadow-lg shadow-black/5">
                  <div className="flex -space-x-2 shrink-0">
                    {['#1c1917', '#b5872a', '#57534e'].map((c) => (
                      <div
                        key={c}
                        className="w-10 h-10 rounded-full border-2 border-white"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-ink text-sm">50+ Produk Premium</p>
                    <div className="flex gap-2 mt-1.5">
                      {['Pomade', 'Shampoo', 'Tools'].map((cat) => (
                        <span key={cat} className="text-[10px] font-medium bg-surface-raised border border-surface-muted px-2 py-1 rounded-full text-surface-sub">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 3 — Rating */}
                <div className="glass-card p-5 flex items-center gap-4 shadow-lg shadow-black/5">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="font-display text-2xl font-bold text-surface-ink leading-none">4.8</p>
                    <p className="text-xs text-surface-sub mt-1">dari 328 ulasan terverifikasi</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[{ w: '70%', n: 5 }, { w: '20%', n: 4 }, { w: '10%', n: 3 }].map((b) => (
                      <div key={b.n} className="flex items-center gap-2">
                        <span className="text-[10px] text-surface-border w-2">{b.n}</span>
                        <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: b.w }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── Featured Products — same ProductCard as catalog ─── */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <div className="divider" />

      {/* ─── Features ─── */}
      <section className="section-container py-16 lg:py-20">
        <div className="text-center mb-12">
          <p className="label-upper mb-3">Kenapa Chief Supplies</p>
          <h2 className="heading-lg max-w-md mx-auto text-balance">Lebih dari sekadar toko grooming</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`rounded-xl border p-6 space-y-4 ${f.color}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center border border-white/80`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-border bg-white/60 px-2 py-1 rounded-full border border-white/80">
                  {f.badge}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-surface-border">0{i + 1}</span>
                  <h3 className="font-semibold text-surface-ink">{f.title}</h3>
                </div>
                <p className="text-sm text-surface-sub leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ─── AI CTA Banner ─── */}
      <section className="section-container py-16 lg:py-20">
        <div className="bg-surface-ink rounded-2xl px-8 py-12 lg:px-16 lg:py-16 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-accent-light" />
                <span className="text-xs font-semibold text-white/70">Powered by GPT-4o</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                Temukan Gaya yang<br />
                <span className="italic text-accent-light">Tepat untuk Anda.</span>
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Unggah foto wajah Anda dan biarkan AI kami menganalisis bentuk wajah,
                lalu merekomendasikan produk dan gaya rambut yang paling sesuai.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                href="/ai-recommendation"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-surface-ink font-semibold text-sm rounded-lg hover:bg-surface-raised transition-colors"
              >
                <Star className="w-4 h-4 text-accent" />
                Mulai Analisis Gratis
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Lihat Katalog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
