import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { verifyJWT } from '@/lib/auth/jwt';
import { getTokenFromCookies } from '@/lib/auth/getToken';

/**
 * POST /api/admin/users/[id]/grant-credit
 * Manually grant AI credits to a specific user.
 * Admin only.
 *
 * Body: { amount: number }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Verify admin auth
  // [SEC-06] Use standardized cookie helper instead of manual string-split
  const token = getTokenFromCookies();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await verifyJWT(token);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const amount = Math.max(1, Math.min(Number(body.amount) || 1, 100)); // clamp 1–100

    const user = await User.findByIdAndUpdate(
      params.id,
      { $inc: { ai_credits: amount } },
      { new: true }
    ).select('name email ai_credits');

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    console.log(`[Admin] Granted ${amount} AI credit(s) to user ${user.email}`);

    return NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, ai_credits: user.ai_credits },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
