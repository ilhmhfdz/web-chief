'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { refreshAuth } from '@/hooks/useAuth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Inner component that uses useSearchParams
function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar. Silakan coba lagi.');
      }

      // Trigger navbar re-fetch SEBELUM navigasi agar langsung terupdate
      refreshAuth();

      // Redirect ke callbackUrl jika ada, atau ke homepage
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
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
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftar dengan Google');
      
      refreshAuth();
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 sm:p-10">
      <div className="text-center mb-8">
        <h1 className="heading-lg mb-2">Buat Akun Baru</h1>
        <p className="text-surface-sub">Bergabung dengan Chief Supplies untuk produk premium</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">
            Nama Lengkap
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-surface-sub" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field pl-11"
              placeholder="Nama Lengkap"
            />
          </div>
        </div>

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
              minLength={8}
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

        <div>
          <label className="block text-sm font-semibold text-surface-ink mb-2">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-surface-sub" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-11 pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-sub hover:text-surface-ink transition-colors focus:outline-none"
            >
              {showConfirmPassword ? (
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
              Buat Akun <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface-base text-surface-sub">Atau daftar dengan</span>
          </div>
        </div>

        <div className="flex justify-center">
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
               <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Pendaftaran Google gagal.')}
                  useOneTap
               />
            </GoogleOAuthProvider>
          ) : (
            <p className="text-xs text-red-500">Google Client ID belum dikonfigurasi</p>
          )}
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-surface-sub">
        Sudah punya akun?{' '}
        <Link
          href={`/login${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}` : ''}`}
          className="text-surface-ink hover:text-accent-dark font-semibold transition-colors"
        >
          Masuk sekarang
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
          <RegisterForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
