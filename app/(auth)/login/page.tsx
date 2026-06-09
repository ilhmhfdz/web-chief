'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { refreshAuth } from '@/hooks/useAuth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Inner component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      return false;
    }
    if (password.length < 8) {
      setError('Kata sandi harus minimal 8 karakter.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan pada server. Silakan coba lagi.');
      }

      // Trigger navbar re-fetch SEBELUM navigasi agar langsung terupdate
      refreshAuth();

      // Prioritas redirect:
      // 1. callbackUrl dari query param (misal dari cart/checkout guard)
      // 2. Admin → /admin
      // 3. Default → /
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else if (data.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal login dengan Google');
      
      refreshAuth();
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else if (data.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 sm:p-10">
      <div className="text-center mb-8">
        <h1 className="heading-lg mb-2">Selamat Datang</h1>
        <p className="text-surface-sub">Masuk ke akun Chief Supplies Anda</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">
            Alamat Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-surface-sub" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-11"
              placeholder="anda@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-surface-sub" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-11 pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-sub hover:text-surface-ink transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-6"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Masuk <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface-base text-surface-sub">Atau lanjutkan dengan</span>
          </div>
        </div>

        <div className="flex justify-center">
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
               <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Login Google gagal.')}
                  useOneTap
               />
            </GoogleOAuthProvider>
          ) : (
            <p className="text-xs text-red-500">Google Client ID belum dikonfigurasi</p>
          )}
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-surface-sub">
        Belum punya akun?{' '}
        <Link
          href="/register"
          className="text-surface-ink hover:text-accent-dark font-semibold transition-colors"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={
          <div className="glass-card p-8 sm:p-10 flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-surface-sub" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
