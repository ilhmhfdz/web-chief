'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RefreshCcw, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import HairstyleVisualCard from './HairstyleVisualCard';
import AuthRequiredPopup from './AuthRequiredPopup';
import NoCreditPopup from './NoCreditPopup';
import Link from 'next/link';
import ProductCard from '@/components/shop/ProductCard';

const WEBCAM_CONFIG = { 
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

type Status = 'idle' | 'capturing' | 'generating' | 'done';
type AuthState = { userId: string; role: string } | null | 'loading';

const LOADING_STAGES = [
  'Menganalisis struktur wajah...',
  'Mendeteksi proporsi tulang pipi & rahang...',
  'Menentukan bentuk wajah ideal...',
  'Mencari referensi gaya rambut di database...',
  'Menyusun perbandingan visual...',
  'Membuat visualisasi gaya rambut AI...',
  'Menyusun rekomendasi produk styling...',
  'Finalisasi tips dari Barber Expert...',
  'Hampir selesai, sedang merender hasil...'
];

export default function FaceAnalyzer() {
  const webcamRef = useRef<Webcam>(null);
  
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'camera' | 'upload' | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingStage, setLoadingStage] = useState(0);

  // ── Auth & Credit State ──────────────────────────────────────────
  const [authUser, setAuthUser] = useState<AuthState>('loading');
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showNoCreditPopup, setShowNoCreditPopup] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Cycle loading stages every 12 seconds for a 3min process
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'generating') {
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev + 1) % LOADING_STAGES.length);
      }, 12000);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Check auth + credit balance on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/ai/credits');
        if (res.status === 401) {
          setAuthUser(null);
          setAiCredits(null);
          return;
        }
        const data = await res.json();
        setAuthUser({ userId: '', role: data.role });
        setAiCredits(data.credits); // -1 = unlimited (admin)
      } catch {
        setAuthUser(null);
        setAiCredits(null);
      }
    };
    checkAuth();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const pRes = await fetch('/api/products?limit=50');
        if (pRes.ok) {
          const pData = await pRes.json();
          const hairProducts = (pData.data || []).filter((p: any) =>
            p.category === 'pomade' ||
            p.category === 'hair' ||
            (p.tags || []).some((t: string) =>
              ['hair', 'pomade', 'clay', 'wax', 'gel', 'styling', 'rambut'].some(
                (k) => t.toLowerCase().includes(k)
              )
            )
          );
          setFilteredProducts(hairProducts.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    };
    fetchProducts();
  }, []);

  // ── Auth Guard ───────────────────────────────────────────────────
  const handleActionGuard = (): boolean => {
    // Still loading auth state
    if (authUser === 'loading') return false;

    // Not logged in
    if (authUser === null) {
      setShowAuthPopup(true);
      return false;
    }

    // Admin: unlimited, no credit check
    if (authUser.role === 'admin') return true;

    // Customer: check credits
    if (aiCredits !== null && aiCredits <= 0) {
      setShowNoCreditPopup(true);
      return false;
    }

    return true;
  };

  const resizeImage = (dataUrl: string, maxDimension: number = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const generateVisual = useCallback(async (base64Image: string) => {
    setStatus('generating');
    setError(null);
    setResultImageUrl(null);
    setAnalysisText(null);

    try {
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Format gambar tidak valid.');
      }
      const mimeType = matches[1];
      const imageBase64 = matches[2];

      const response = await fetch('/api/ai/hairstyle-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      const data = await response.json();

      // Handle specific error codes from API
      if (response.status === 401 || data.error === 'AUTH_REQUIRED') {
        setShowAuthPopup(true);
        setStatus('idle');
        return;
      }
      if (response.status === 402 || data.error === 'NO_CREDIT') {
        setShowNoCreditPopup(true);
        setStatus('idle');
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat visualisasi.');
      }

      // Success: deduct local credit counter
      if (authUser !== 'loading' && authUser !== null && authUser.role !== 'admin') {
        setAiCredits(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
      }

      setResultImageUrl(data.imageUrl);
      setAnalysisText(data.analysisText);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
      setStatus('capturing');
    }
  }, [authUser]);

  const startCamera = () => {
    if (!handleActionGuard()) return;
    setMode('camera');
    setStatus('capturing');
    setImageUrl(null);
    setResultImageUrl(null);
    setAnalysisText(null);
    setError(null);
  };

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;
    setImageUrl(shot);
    await generateVisual(shot);
  }, [generateVisual]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleActionGuard()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 4 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 4MB.');
      return;
    }

    setMode('upload');
    setImageUrl(null);
    setResultImageUrl(null);
    setAnalysisText(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      let dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      setImageUrl(dataUrl);
      dataUrl = await resizeImage(dataUrl, 1024);
      await generateVisual(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setMode(null);
    setStatus('idle');
    setImageUrl(null);
    setResultImageUrl(null);
    setAnalysisText(null);
    setError(null);
  };

  if (!mounted) return null;

  const isAdmin = authUser !== 'loading' && authUser !== null && authUser.role === 'admin';
  const isLoggedIn = authUser !== 'loading' && authUser !== null;
  const creditsDisplay = isAdmin ? -1 : (aiCredits ?? 0);

  return (
    <>
      {/* ── Auth Popups ── */}
      <AuthRequiredPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} />
      <NoCreditPopup
        isOpen={showNoCreditPopup}
        onClose={() => setShowNoCreditPopup(false)}
        creditsRemaining={aiCredits ?? 0}
      />

      <div className="w-full max-w-5xl mx-auto space-y-12 p-4 md:p-8">
        {/* ── Header ── */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-dark text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3" /> AI-Powered Grooming
          </div>
          <h1 className="heading-xl tracking-tight">Face Architect Visual</h1>
          <p className="text-surface-sub max-w-2xl mx-auto text-lg mb-4">
            Ambil foto wajah Anda untuk melihat perbandingan gaya rambut dengan AI Generatif.
          </p>

          {/* ── Credit Badge ── */}
          <div className="flex justify-center">
            {authUser === 'loading' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-surface-muted text-sm text-surface-sub animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat...
              </div>
            )}
            {isLoggedIn && !isAdmin && (
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium
                ${creditsDisplay > 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'}`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">{creditsDisplay}</span>
                <span className="opacity-80">credit tersisa</span>
              </div>
            )}
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Admin — Unlimited Generate
              </div>
            )}
            {!isLoggedIn && authUser !== 'loading' && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-raised border border-surface-muted text-sm text-surface-sub">
                <Sparkles className="w-4 h-4" />
                <Link href="/login" className="text-accent-dark font-semibold hover:underline">Login</Link>
                &nbsp;untuk mendapatkan 1 credit gratis
              </div>
            )}
          </div>

          {/* Tutorial Steps */}
          {status === 'idle' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 max-w-3xl mx-auto">
              {[
                { num: '1', title: 'Upload Foto', desc: 'Ambil foto wajah lurus dengan pencahayaan terang' },
                { num: '2', title: 'Analisis AI', desc: 'AI mendeteksi bentuk wajah dan struktur proporsi Anda' },
                { num: '3', title: 'Lihat Hasil', desc: 'Dapatkan rekomendasi gaya rambut dan produk terbaik' }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center max-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-surface-ink text-white font-bold flex items-center justify-center mb-3">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-surface-ink text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-surface-sub leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4 flex-wrap">
            {status === 'idle' && (
              <>
                <button
                  onClick={startCamera}
                  className="btn-primary flex items-center gap-2 px-8 py-4"
                >
                  <Camera className="w-5 h-5" /> Gunakan Kamera
                </button>
                <label className="btn-secondary flex items-center gap-2 px-8 py-4 cursor-pointer">
                  <Upload className="w-5 h-5" /> Upload Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </>
            )}

            {status === 'generating' && (
              <div className="flex flex-col items-center gap-4 px-8 py-8 bg-surface-raised border border-surface-muted rounded-2xl w-full max-w-lg mx-auto shadow-xl">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-accent-dark" />
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg font-bold text-surface-ink tracking-tight">AI sedang bekerja...</p>
                  <motion.p 
                    key={loadingStage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-accent-dark h-5"
                  >
                    {LOADING_STAGES[loadingStage]}
                  </motion.p>
                  <p className="text-[11px] text-surface-sub font-medium bg-surface/50 py-1 px-3 rounded-full inline-block mt-2">
                    Proses ini memakan waktu 1-3 menit, harap tidak menutup halaman.
                  </p>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-2 mt-4 overflow-hidden relative">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-accent to-accent-dark rounded-full"
                  />
                </div>
              </div>
            )}

            {mode === 'camera' && status === 'capturing' && !imageUrl && (
              <button
                onClick={capturePhoto}
                className="btn-primary flex items-center gap-2 px-12 py-4"
              >
                <Camera className="w-5 h-5" /> Ambil Foto
              </button>
            )}

            {(status === 'done' || (status === 'capturing' && imageUrl)) && (
              <button
                onClick={reset}
                className="btn-secondary flex items-center gap-2 px-8 py-4"
              >
                <RefreshCcw className="w-4 h-4" /> Mulai Ulang
              </button>
            )}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs underline">
              Tutup
            </button>
          </div>
        )}

        {/* ── Main Viewport ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* Source Image Panel */}
          <div className="relative w-full aspect-[4/3] bg-surface-raised border border-surface-muted rounded-3xl overflow-hidden shadow-lg flex items-center justify-center">
            {status === 'idle' && (
              <div className="text-surface-sub flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-surface/50 flex items-center justify-center mb-6">
                  <Camera className="w-10 h-10 opacity-40" />
                </div>
                <p className="label-upper tracking-widest">Siap Foto</p>
              </div>
            )}

            {mode === 'camera' && status === 'capturing' && !imageUrl && (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={WEBCAM_CONFIG}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Source"
                style={{ objectFit: 'cover' }}
                className={`absolute inset-0 w-full h-full ${mode === 'camera' && (status === 'capturing' || status === 'generating' || status === 'done') ? 'scale-x-[-1]' : ''}`}
              />
            )}
            
            {status === 'generating' && (
              <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent/20 border-t-accent-dark rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Result Image Panel */}
          <div className="w-full flex items-center justify-center">
            <HairstyleVisualCard 
              imageUrl={resultImageUrl} 
              analysisText={analysisText}
              isLoading={status === 'generating'} 
            />
          </div>
        </div>

        {/* Product recommendations */}
        {(status === 'done' || filteredProducts.length > 0) && (
          <div className="space-y-8 pt-12 border-t border-surface-muted">
            <div>
              <h3 className="heading-md tracking-tight">Rekomendasi Produk Styling</h3>
              <p className="text-surface-sub">
                Produk pilihan untuk memaksimalkan gaya rambut baru Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-surface-raised rounded-2xl border border-dashed border-surface-muted">
                  <p className="text-surface-sub italic text-sm">
                    Belum ada produk styling tersedia saat ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
