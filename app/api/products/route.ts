import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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

// ---- POST /api/products (admin only) ----
export async function POST(req: NextRequest) {
  // [SEC-02] Enforce admin role via header injected by middleware.
  // The x-user-role header is ONLY set by the middleware after verifying the JWT.
  // Route is protected by the middleware matcher (see middleware.ts).
  const userRole = req.headers.get('x-user-role');
  if (!userRole || userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden — Admin access required' },
      { status: 403 }
    );
  }

  try {
    await dbConnect();
    const body = await req.json();

    // Whitelist allowed fields — prevent mass assignment
    const {
      name,
      description,
      price,
      stock,
      category,
      image_url,
      images,
      tags,
      is_active,
    } = body;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      image_url,
      images,
      tags,
      is_active,
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
