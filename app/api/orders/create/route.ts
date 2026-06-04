import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models/Order';
import { Product } from '@/lib/db/models/Product';
import { verifyJWT } from '@/lib/auth/jwt';
import { getTokenFromRequest } from '@/lib/auth/getToken';

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Auth ─────────────────────────────────────────────────
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    const userId = (payload.userId ?? payload.sub) as string;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Step 2: Parse body ───────────────────────────────────────────
    const body = await request.json();
    const { items, shipping_address, payment_method, shipping_cost = 15000 } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    await dbConnect();

    // ── Step 3: [BIZ-03] Validate prices & availability from DB ─────
    // NEVER trust price data coming from the client.
    const productIds = items.map((i: any) => i.product_id);
    const dbProducts = await Product.find({
      _id: { $in: productIds },
      is_active: true,
    }).lean();

    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    const validatedItems: {
      product_id: string;
      name: string;
      price: number;
      quantity: number;
      image_url: string;
    }[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.product_id?.toString());

      if (!dbProduct) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan atau sudah tidak aktif` },
          { status: 400 }
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: `Jumlah produk "${dbProduct.name}" tidak valid` },
          { status: 400 }
        );
      }

      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok "${dbProduct.name}" tidak mencukupi (tersisa ${dbProduct.stock})` },
          { status: 400 }
        );
      }

      validatedItems.push({
        product_id: item.product_id,
        name: dbProduct.name,            // from DB — don't trust client
        price: dbProduct.price,          // from DB — don't trust client
        quantity: item.quantity,
        image_url: dbProduct.image_url,  // from DB — don't trust client
      });
    }

    // ── Step 4: [BIZ-04] Atomically deduct stock ────────────────────
    // Each update only succeeds if stock >= requested quantity (prevents oversell).
    for (const item of validatedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product_id, stock: { $gte: item.quantity }, is_active: true },
        { $inc: { stock: -item.quantity } }
      );

      if (!updated) {
        // Another concurrent order snatched the last stock — abort
        return NextResponse.json(
          { error: `Stok "${item.name}" habis terjual. Silakan refresh dan coba lagi.` },
          { status: 409 }
        );
      }
    }

    // ── Step 5: Compute totals & Save Order ─────────────────────────
    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total_price = subtotal + shipping_cost;

    const order = await Order.create({
      user_id: userId,
      items: validatedItems,
      subtotal,
      shipping_cost,
      total_price,
      status: 'pending',
      payment_gateway: payment_method === 'cod' ? null : 'midtrans',
      shipping_address,
    });

    return NextResponse.json({ success: true, orderId: order._id.toString() }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
