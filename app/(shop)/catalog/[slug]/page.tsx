import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Product as ProductModel } from '@/lib/db/models/Product';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/utils/format';
import ProductDetailClient from './ProductDetailClient';

// ============================================================
// Data fetching — Server-side
// ============================================================

async function getProductBySlug(slug: string): Promise<Product | null> {
  await dbConnect();
  const product = await ProductModel.findOne({ slug, is_active: true }).lean();
  if (!product) return null;
  return JSON.parse(JSON.stringify(product)) as Product;
}

async function getRelatedProducts(category: string, excludeSlug: string): Promise<Product[]> {
  await dbConnect();
  const products = await ProductModel
    .find({ category, slug: { $ne: excludeSlug }, is_active: true })
    .limit(4)
    .lean();
  return JSON.parse(JSON.stringify(products)) as Product[];
}

// ============================================================
// Metadata
// ============================================================

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  await dbConnect();
  const product = await ProductModel.findOne({ slug: params.slug }).lean() as any;
  if (!product) return { title: 'Produk Tidak Ditemukan' };
  return {
    title: `${product.name} — Chief Supplies`,
    description: product.description,
    openGraph: { images: [product.image_url] },
  };
}

// ============================================================
// Page — Server Component
// ============================================================

export default async function ProductDetailPage(
  { params }: { params: { slug: string } }
) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, params.slug);

  return <ProductDetailClient product={product} related={related} />;
}
