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

      <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center">
        
        {/* ── Left Column: Controls & Context ── */}
        <div className="w-full lg:w-[45%] flex flex-col gap-8 sticky top-24">
          
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-raised border border-surface-muted/50 backdrop-blur-md shadow-sm text-accent-dark text-xs font-bold tracking-widest uppercase"
            >
              <Sparkles className="w-3.5 h-3.5" /> Pro Max AI
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-surface-ink leading-tight [text-wrap:balance]"
            >
              Face Architect Visual
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-surface-sub text-lg leading-relaxed [text-wrap:pretty]"
            >
              Dapatkan rekomendasi gaya rambut paling ideal berdasarkan analisis presisi proporsi tulang pipi dan bentuk rahang Anda.
            </motion.p>
          </div>

          {/* ── Credit Badge ── */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center"
          >
            {authUser === 'loading' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-surface-muted text-sm text-surface-sub animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat...
              </div>
            )}
            {isLoggedIn && !isAdmin && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm backdrop-blur-md
                ${creditsDisplay > 0
                  ? 'bg-green-500/10 border-green-500/20 text-green-700'
                  : 'bg-red-500/10 border-red-500/20 text-red-600'}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{creditsDisplay} Credit Tersisa</span>
              </div>
            )}
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm font-semibold backdrop-blur-md shadow-sm">
                <Sparkles className="w-4 h-4" />
                Admin / Unlimited
              </div>
            )}
            {!isLoggedIn && authUser !== 'loading' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-raised border border-surface-muted text-sm text-surface-sub backdrop-blur-md shadow-sm">
                <Sparkles className="w-4 h-4" />
                <Link href="/login" className="text-accent-dark font-bold hover:underline">Login</Link>
                <span>untuk credit gratis</span>
              </div>
            )}
          </motion.div>

          {/* ── Controls ── */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="pt-4 flex flex-col sm:flex-row gap-4"
          >
            {status === 'idle' && (
              <>
                <button
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-surface-ink text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <Camera className="w-5 h-5 relative z-10" /> 
                  <span className="relative z-10">Buka Kamera</span>
                </button>
                <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-surface-raised border border-surface-muted/50 text-surface-ink font-semibold text-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-muted transition-all duration-300 cursor-pointer shadow-sm backdrop-blur-md">
                  <Upload className="w-5 h-5" /> 
                  <span>Upload Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </>
            )}

            {mode === 'camera' && status === 'capturing' && !imageUrl && (
              <button
                onClick={capturePhoto}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-accent-dark text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(var(--color-accent-dark)/0.4)] transition-all duration-300"
              >
                <Camera className="w-5 h-5" /> Ambil Foto Sekarang
              </button>
            )}

            {(status === 'done' || (status === 'capturing' && imageUrl)) && (
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-surface-raised border border-surface-muted/50 text-surface-ink font-semibold text-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-muted transition-all duration-300 shadow-sm backdrop-blur-md"
              >
                <RefreshCcw className="w-5 h-5" /> Mulai Analisis Baru
              </button>
            )}
          </motion.div>

          {/* ── Error Banner ── */}
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-700 px-6 py-4 rounded-2xl flex items-start gap-3 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-medium underline">
                Tutup
              </button>
            </motion.div>
          )}

          {/* Tutorial / Features (Only show when idle to save space later) */}
          {status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { title: 'Presisi Tinggi', desc: 'Pemindaian rasio wajah AI' },
                { title: 'Personalisasi', desc: 'Gaya rambut yang cocok untuk Anda' }
              ].map((ft, i) => (
                <div key={i} className="p-4 rounded-2xl bg-surface-raised/50 border border-surface-muted/30 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4 text-accent-dark" />
                  </div>
                  <h4 className="font-semibold text-sm text-surface-ink mb-1">{ft.title}</h4>
                  <p className="text-xs text-surface-sub">{ft.desc}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Right Column: Interactive Viewport ── */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6 relative">
          
          <motion.div 
            layout
            className="relative w-full aspect-[4/3] sm:aspect-[3/4] md:aspect-[4/3] lg:aspect-[4/5] xl:aspect-[3/4] bg-surface-raised/40 border border-surface-muted/50 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xl"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-raised via-transparent to-surface-muted/20 mix-blend-overlay pointer-events-none z-0" />

            {status === 'idle' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-surface-sub flex flex-col items-center z-10 p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-surface-muted/30 flex items-center justify-center mb-6 shadow-inner relative">
                  <div className="absolute inset-0 rounded-full border border-surface-muted animate-[spin_10s_linear_infinite]" />
                  <Camera className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-sm font-semibold tracking-widest uppercase text-surface-ink/50 mb-2">Area Pemindaian</p>
                <p className="text-xs max-w-[250px] [text-wrap:balance]">Pastikan wajah berada di tengah dan pencahayaan cukup terang.</p>
              </motion.div>
            )}

            {mode === 'camera' && status === 'capturing' && !imageUrl && (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={WEBCAM_CONFIG}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10"
              />
            )}

            {imageUrl && status !== 'done' && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Source"
                className={`absolute inset-0 w-full h-full object-cover z-10 ${mode === 'camera' ? 'scale-x-[-1]' : ''}`}
              />
            )}
            
            {/* Cinematic Generating State over the source image */}
            {status === 'generating' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 overflow-hidden flex flex-col"
              >
                {/* Darken overlay */}
                <div className="absolute inset-0 bg-surface-ink/60 backdrop-blur-sm" />
                
                {/* Laser scanner line */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_20px_rgb(var(--color-accent))] z-30"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                />

                {/* Progress Content */}
                <div className="relative z-30 flex-1 flex flex-col items-center justify-center p-8">
                  <div className="relative w-20 h-20 mb-8">
                    <motion.div 
                      className="absolute inset-0 border-4 border-accent-dark/30 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="absolute inset-0 border-4 border-transparent border-t-accent-dark rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                  </div>
                  
                  <div className="text-center space-y-3 relative w-full h-16">
                    <motion.p 
                      key={loadingStage}
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                      className="text-lg font-bold text-white absolute inset-0 [text-wrap:balance]"
                    >
                      {LOADING_STAGES[loadingStage]}
                    </motion.p>
                  </div>
                  <div className="w-48 bg-white/10 rounded-full h-1 mt-6 overflow-hidden">
                    <motion.div
                      className="h-full bg-accent-dark"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* When Done, just show the Result Card filling this space or transitioning */}
            {status === 'done' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="absolute inset-0 z-30 bg-surface w-full h-full overflow-y-auto custom-scrollbar"
              >
                <div className="p-4 md:p-6 w-full h-full">
                  <HairstyleVisualCard 
                    imageUrl={resultImageUrl} 
                    analysisText={analysisText}
                    isLoading={false} 
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Product Recommendations (Appears below when done) ── */}
      {(status === 'done' || filteredProducts.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-16 pt-16 border-t border-surface-muted/50"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-end justify-between mb-8">
            <div className="max-w-2xl">
              <h3 className="text-3xl font-bold tracking-tight text-surface-ink mb-3">Sempurnakan Gaya Anda</h3>
              <p className="text-surface-sub text-lg [text-wrap:pretty]">
                Produk pilihan dari expert kami untuk menata rekomendasi gaya rambut AI Anda di rumah.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-surface-raised/50 rounded-3xl border border-dashed border-surface-muted/50 backdrop-blur-sm">
                <p className="text-surface-sub font-medium">
                  Belum ada produk styling tersedia saat ini.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
