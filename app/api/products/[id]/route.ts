import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Product } from '@/lib/db/models/Product';

type RouteContext = { params: { id: string } };

function buildFilter(id: string) {
  return id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
}

// ---- GET /api/products/[id] ----
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await dbConnect();
    const product = await Product.findOne(buildFilter(params.id)).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ data: product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// ---- PATCH /api/products/[id] ----
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await dbConnect();
    const body = await req.json();
    const product = await Product.findOneAndUpdate(
      buildFilter(params.id),
      { $set: body },
      { new: true, runValidators: true }
    ).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ data: product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// ---- DELETE /api/products/[id] ----
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await dbConnect();
    const product = await Product.findOneAndDelete(buildFilter(params.id));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
