import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { signJWT } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Name, email, and password are required and must be valid text' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local',
    });

    const token = await signJWT({ userId: (user._id as unknown) as string, role: user.role });

    const response = NextResponse.json(
      { message: 'Registered successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
