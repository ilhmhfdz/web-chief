import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Calendar, Tag } from 'lucide-react';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import { formatPrice } from '@/lib/utils/format';
import { serializeDoc } from '@/lib/db/serialize';

// ============================================================
// Types (serialized for Server → Client boundary)
// ============================================================

interface SerializedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

interface SerializedArticle {
  slug: string;
  title: string;
  current_content: string;
  meta_description: string;
  geo_keywords: string[];
  related_products: SerializedProduct[];
  last_adapted_at: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Data fetching
// ============================================================

async function getArticle(slug: string): Promise<SerializedArticle | null> {
  await dbConnect();

  const article = await AdaptiveArticle.findOne({
    slug,
    is_active: true,
  })
    .populate({
      path: 'related_products',
      select: 'name slug price image_url category description',
      match: { is_active: true },
    })
    .lean();

  if (!article) return null;

  return serializeDoc<SerializedArticle>(article);
}

// ============================================================
// Dynamic Metadata (SEO)
// ============================================================

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return { title: 'Artikel Tidak Ditemukan' };
  }

  return {
    title: article.title,
    description: article.meta_description || `Baca artikel "${article.title}" dari Chief Supplies`,
    keywords: article.geo_keywords,
    openGraph: {
      title: article.title,
      description: article.meta_description,
      type: 'article',
      locale: 'id_ID',
      siteName: 'Chief Supplies',
    },
  };
}

// ============================================================
// JSON-LD TechArticle Schema
// ============================================================

function ArticleJsonLd({ article }: { article: SerializedArticle }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.meta_description,
    datePublished: article.createdAt,
    dateModified: article.last_adapted_at ?? article.updatedAt,
    about: article.geo_keywords.map((keyword) => ({
      '@type': 'Thing',
      name: keyword,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'Chief Supplies',
      url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://chief-supplies.id',
    },
    author: {
      '@type': 'Organization',
      name: 'Chief Supplies',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/articles/${article.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Related Products Section
// ============================================================

function RelatedProducts({ products }: { products: SerializedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-surface-muted/60">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-surface-ink flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-surface-ink leading-tight">
            Produk yang Direkomendasikan
          </h2>
          <p className="text-xs text-surface-sub mt-0.5">
            Produk Chief Supplies yang relevan dengan artikel ini
          </p>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/catalog/${product.slug}`}
            className="glass-card card-hover flex gap-4 p-4 group"
          >
            {/* Product image */}
            <div className="w-20 h-20 rounded-lg bg-surface-raised overflow-hidden shrink-0 border border-surface-muted/50">
              <Image
                src={product.image_url}
                alt={product.name}
                width={80}
                height={80}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-surface-sub">
                {product.category}
              </span>
              <h3 className="text-sm font-semibold text-surface-ink line-clamp-2 mt-0.5 group-hover:text-surface-sub transition-colors">
                {product.name}
              </h3>
              <p className="text-sm font-bold text-surface-ink mt-1.5">
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Page — Server Component
// ============================================================

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD Rich Schema */}
      <ArticleJsonLd article={article} />

      <div className="min-h-screen bg-surface">
        {/* ── Article Hero ── */}
        <div className="relative bg-gradient-to-b from-surface-raised to-surface border-b border-surface-muted/60">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #1c1917 0, #1c1917 1px, transparent 0, transparent 50%)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="section-container py-8 lg:py-12 relative">
            {/* Back link */}
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-sub hover:text-surface-ink transition-colors mb-5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Semua Artikel
            </Link>

            {/* Keywords */}
            {article.geo_keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Tag className="w-3 h-3 text-surface-border" />
                {article.geo_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="badge-default text-[10px]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="heading-lg max-w-3xl">{article.title}</h1>

            {/* Meta info */}
            {article.last_adapted_at && (
              <div className="flex items-center gap-2 mt-4 text-xs text-surface-sub">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Diperbarui{' '}
                  {new Date(article.last_adapted_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Article Content ── */}
        <div className="section-container py-8 lg:py-12">
          <div className="max-w-3xl mx-auto">
            {/* Rendered HTML content with article prose styling */}
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: article.current_content }}
            />

            {/* Related Products */}
            <RelatedProducts products={article.related_products} />
          </div>
        </div>
      </div>
    </>
  );
}
