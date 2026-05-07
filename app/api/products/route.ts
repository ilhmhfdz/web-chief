import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';
import type { ProductCategory, ProductsQueryParams } from '@/types/product';

// ---- GET /api/products ----
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    // Parse & validate query params
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 12)));
    const category = searchParams.get('category') as ProductCategory | 'all' | null;
    const search = searchParams.get('search')?.trim() ?? '';
    const sort = searchParams.get('sort') ?? 'newest';

    // Build MongoDB filter
    const filter: Record<string, unknown> = { is_active: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Build MongoDB sort
    const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sortQuery = SORT_MAP[sort] ?? SORT_MAP.newest;

    const skip = (page - 1) * limit;

    // Run query + count in parallel for efficiency
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---- POST /api/products (admin only — seeded via API for convenience) ----
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const product = await Product.create(body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
