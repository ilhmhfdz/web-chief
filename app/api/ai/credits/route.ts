import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { getTokenFromCookies } from '@/lib/auth/getToken';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

/**
 * GET /api/ai/credits
 * Returns the AI credit balance for the currently authenticated user.
 * Admin users get credits = -1 (unlimited).
 */
export async function GET(req: Request) {
  // [SEC-06] Use standardized cookie helper
  const token = getTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyJWT(token);
    const role = payload.role as string;
    const userId = payload.userId as string;

    // Admin has unlimited credits — return sentinel value -1
    if (role === 'admin') {
      return NextResponse.json({ credits: -1, role: 'admin' });
    }

    await dbConnect();
    const user = await User.findById(userId).select('ai_credits');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ credits: user.ai_credits ?? 0, role: 'customer' });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
