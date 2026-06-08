import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { AdaptiveArticle } from '@/lib/db/models/AdaptiveArticle';
import { serializeDoc } from '@/lib/db/serialize';

// ============================================================
// GET /api/admin/articles — list all articles (admin only)
// ============================================================
export async function GET() {
  try {
    await dbConnect();
    const articles = await AdaptiveArticle.find()
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ data: articles.map((a) => serializeDoc(a)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/articles — create article manually (admin only)
// Middleware at /api/admin/* enforces admin JWT automatically.
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { title, slug, current_content, meta_description, geo_keywords, is_active } = body;

    if (!title || !current_content) {
      return NextResponse.json(
        { error: 'title dan current_content wajib diisi' },
        { status: 400 }
      );
    }

    // Auto-generate slug from title if not provided
    const finalSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    // Check slug uniqueness
    const existing = await AdaptiveArticle.findOne({ slug: finalSlug });
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${finalSlug}" sudah digunakan. Gunakan slug lain.` },
        { status: 409 }
      );
    }

    const article = await AdaptiveArticle.create({
      title: title.trim(),
      slug: finalSlug,
      current_content,
      meta_description: meta_description?.trim() ?? '',
      geo_keywords: Array.isArray(geo_keywords) ? geo_keywords : [],
      is_active: is_active ?? false, // default: Draft (inactive)
    });

    return NextResponse.json({ data: serializeDoc(article.toObject()) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// PATCH /api/admin/articles — update article (admin only)
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, is_active, title, slug, current_content, meta_description, geo_keywords } = body;

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    // Build update object dynamically based on provided fields
    const updateData: any = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (current_content !== undefined) updateData.current_content = current_content;
    if (meta_description !== undefined) updateData.meta_description = meta_description.trim();
    if (geo_keywords !== undefined) {
      updateData.geo_keywords = Array.isArray(geo_keywords) ? geo_keywords : [];
    }

    const updated = await AdaptiveArticle.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: serializeDoc(updated) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/admin/articles — delete article by id (admin only)
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });
    }

    await AdaptiveArticle.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
