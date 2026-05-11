import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export const metadata = {
  title: 'Pengaturan Profil - Chief Supplies',
  description: 'Atur profil dan informasi akun Anda',
};

export default async function ProfilePage() {
  // 1. Get the session token
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // 2. Verify token and get userId
  let payload;
  try {
    payload = await verifyJWT(token);
  } catch (error) {
    redirect('/login');
  }

  // 3. Fetch real user data from DB
  await connectDB();
  const userDoc = await User.findById(payload.userId).select('name email role ai_credits').lean();

  if (!userDoc) {
    redirect('/login');
  }

  // Prepare plain object to pass to Client Component
  const user = {
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    ai_credits: userDoc.ai_credits || 0,
  };

  return <ProfilePageClient user={user} />;
}
