'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Quote } from 'lucide-react';
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
    <div className="w-full max-w-sm mx-auto space-y-8">
      <div className="text-left mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-surface-ink mb-2">Buat Akun Baru</h1>
        <p className="text-surface-sub">Bergabung dengan Chief Supplies untuk produk premium</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-surface-ink mb-2">
            Nama Lengkap
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-surface-sub group-focus-within:text-surface-ink transition-colors" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-surface-border text-surface-ink rounded-lg pl-11 py-3 focus:outline-none focus:ring-2 focus:ring-surface-ink focus:border-transparent transition-all shadow-sm"
              placeholder="Nama Lengkap"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-surface-ink mb-2">
            Alamat Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-surface-sub group-focus-within:text-surface-ink transition-colors" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-surface-border text-surface-ink rounded-lg pl-11 py-3 focus:outline-none focus:ring-2 focus:ring-surface-ink focus:border-transparent transition-all shadow-sm"
              placeholder="anda@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-surface-ink mb-2">
            Kata Sandi
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-surface-sub group-focus-within:text-surface-ink transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              name="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-surface-border text-surface-ink rounded-lg pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-surface-ink focus:border-transparent transition-all shadow-sm"
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
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-surface-ink mb-2">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-surface-sub group-focus-within:text-surface-ink transition-colors" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface border border-surface-border text-surface-ink rounded-lg pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-surface-ink focus:border-transparent transition-all shadow-sm"
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
          className="w-full py-3.5 px-4 bg-surface-ink hover:bg-black text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Buat Akun <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface text-surface-sub">Atau daftar dengan</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
               <div className="w-full flex justify-center">
                 <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Pendaftaran Google gagal.')}
                    useOneTap
                    size="large"
                    shape="rectangular"
                 />
               </div>
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
          className="text-surface-ink hover:text-accent-dark font-semibold transition-colors hover:underline underline-offset-4"
        >
          Masuk sekarang
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface">
      {/* Left Panel - Premium Brand Presentation */}
      <div className="hidden lg:flex flex-1 relative bg-surface-ink text-white flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-white/10 to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <h2 className="text-2xl font-black font-rubik tracking-wider">CHIEF</h2>
            <p className="text-xs font-semibold tracking-widest text-white/70 mt-1">BARBER & SUPPLIES CO.</p>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <Quote className="h-10 w-10 text-white/20 mb-6" />
          <h1 className="text-4xl font-bold leading-tight mb-6 text-balance">
            Mulai perjalanan perawatan diri Anda bersama kami.
          </h1>
          <p className="text-lg text-white/70 mb-8 text-balance">
            Daftar sekarang untuk mendapatkan akses eksklusif ke produk premium, penawaran khusus, dan pengalaman belanja yang tak terlupakan.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-ink bg-white/10 flex items-center justify-center text-xs font-bold backdrop-blur-sm">
                  {i === 4 ? '5k+' : ''}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-white/80">
              Pelanggan Puas
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative bg-surface">
        <Link href="/" className="absolute top-8 left-8 lg:hidden">
          <h2 className="text-xl font-black font-rubik tracking-wider text-surface-ink">CHIEF</h2>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm mx-auto"
        >
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-surface-sub" />
              <p className="text-sm text-surface-sub font-medium">Memuat form pendaftaran...</p>
            </div>
          }>
            <RegisterForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
