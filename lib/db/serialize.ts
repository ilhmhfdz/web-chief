/**
 * serialize.ts
 * ─────────────────────────────────────────────────────────────
 * Converts raw Mongoose .lean() results into plain serializable
 * JavaScript objects that are safe to pass from Next.js Server
 * Components to Client Components.
 *
 * Mongoose .lean() still returns:
 *   - _id  → BSON ObjectId  (needs .toString())
 *   - dates → Date objects   (needs .toISOString())
 *
 * These cannot be passed as React props directly, causing the
 * "Only plain objects can be passed to Client Components" warning.
 */

import type { Product } from '@/types/product';

// ────────────────────────────────────────────────────────────────
// Products
// ────────────────────────────────────────────────────────────────

export function serializeProduct(p: any): Product {
  return {
    _id: p._id?.toString() ?? '',
    name: p.name ?? '',
    slug: p.slug ?? '',
    description: p.description ?? '',
    price: p.price ?? 0,
    stock: p.stock ?? 0,
    category: p.category,
    image_url: p.image_url ?? '',
    images: p.images ?? [],
    tags: p.tags ?? [],
    is_active: p.is_active ?? false,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt ?? ''),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt ?? ''),
  };
}

export function serializeProducts(docs: any[]): Product[] {
  return docs.map(serializeProduct);
}

// ────────────────────────────────────────────────────────────────
// Generic helper — converts any ObjectId/Date to string recursively
// ────────────────────────────────────────────────────────────────

export function serializeDoc<T = Record<string, unknown>>(doc: any): T {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(serializeDoc) as unknown as T;
  if (doc instanceof Date) return doc.toISOString() as unknown as T;
  // BSON ObjectId has a toString() method and a _bsontype property
  if (typeof doc === 'object' && doc._bsontype === 'ObjectId') {
    return doc.toString() as unknown as T;
  }
  if (typeof doc === 'object' && typeof doc.toString === 'function' && doc.constructor?.name === 'ObjectId') {
    return doc.toString() as unknown as T;
  }
  if (typeof doc === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(doc)) {
      result[key] = serializeDoc(doc[key]);
    }
    return result as T;
  }
  return doc;
}
