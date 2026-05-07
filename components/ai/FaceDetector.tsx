'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import Webcam from 'react-webcam';
import {
  Camera, Upload, RefreshCcw, Sparkles, Scissors,
  Scan, AlertCircle, ChevronRight, Ruler
} from 'lucide-react';
import { classifyFaceShape, FaceShapeResult } from '@/lib/utils/faceShape';
import RecommendationCard from './RecommendationCard';
import Link from 'next/link';

declare global {
  interface Window {
    FaceMesh: any;
    drawConnectors: any;
    FACEMESH_TESSELATION: any;
  }
}

const WEBCAM_CONFIG = { 
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

type Status = 'idle' | 'initializing' | 'detecting' | 'analyzing' | 'done';

export default function FaceDetector() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);

  // ── statusRef mirrors status state so onResults (registered once) never has stale closure
  const statusRef = useRef<Status>('idle');

  const [mounted, setMounted] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [mode, setMode] = useState<'camera' | 'upload' | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [faceData, setFaceData] = useState<FaceShapeResult | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep statusRef in sync with state
  const updateStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // ── onResults: uses statusRef.current — never stale ──────────────
  const onResults = useCallback(async (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Get accurate dimensions from source image ──
    const imgWidth = (results.image as any)?.videoWidth || (results.image as any)?.naturalWidth || results.image?.width || 640;
    const imgHeight = (results.image as any)?.videoHeight || (results.image as any)?.naturalHeight || results.image?.height || 480;

    // ── Sync canvas dimensions with source image to prevent stretching ──
    if (canvas.width !== imgWidth || canvas.height !== imgHeight) {
      canvas.width = imgWidth;
      canvas.height = imgHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    if (results.multiFaceLandmarks?.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      if (window.drawConnectors && window.FACEMESH_TESSELATION) {
        window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
          color: '#ffffff30',
          lineWidth: 1,
        });
      }
      ctx.restore();

      // Read from ref — always current, no stale closure
      if (statusRef.current === 'analyzing') {
        try {
          const shape = classifyFaceShape(
            landmarks,
            imgWidth,
            imgHeight
          );
          setFaceData(shape);

          // Fetch AI grooming recommendation (non-blocking on failure)
          try {
            const res = await fetch('/api/ai/recommend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `Bentuk wajah terdeteksi: ${shape.shape}. Rasio Geometri: Panjang:Lebar (${shape.measurements.lengthToWidthRatio.toFixed(2)}), Dahi:Pipi (${shape.measurements.foreheadToWidthRatio.toFixed(2)}), Rahang:Pipi (${shape.measurements.jawToWidthRatio.toFixed(2)}). Berikan analisis mendalam, gaya rambut yang spesifik dan cocok dengan struktur ini, dan quick tips grooming praktis.`,
              }),
            });
            if (res.ok) setRecommendations(await res.json());
          } catch {
            // AI recommendation is optional — continue without it
          }

          // Fetch & filter hair/styling products
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
          } catch {
            // Products are optional — continue without them
          }

          updateStatus('done');
        } catch (err) {
          console.error('Face shape classification error:', err);
          setError('Gagal menganalisis struktur wajah. Pastikan wajah terlihat jelas.');
          updateStatus('detecting');
        }
      }
    } else {
      ctx.restore();
      if (statusRef.current === 'analyzing') {
        setError('Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah terlihat penuh.');
        updateStatus('detecting');
      }
    }
  }, [updateStatus]);

  // ── Initialize MediaPipe FaceMesh once scripts are ready ──────────
  const initFaceMesh = useCallback(() => {
    if (!window.FaceMesh || faceMeshRef.current) return;
    try {
      const fm = new window.FaceMesh({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      fm.onResults(onResults);
      faceMeshRef.current = fm;
      console.log('FaceMesh initialized ✓');
    } catch (err) {
      console.error('FaceMesh init failed:', err);
      setError('Gagal inisialisasi AI engine. Coba refresh halaman.');
    }
  }, [onResults]);

  useEffect(() => {
    if (scriptsLoaded && mounted) {
      const t = setTimeout(initFaceMesh, 800);
      return () => clearTimeout(t);
    }
  }, [scriptsLoaded, mounted, initFaceMesh]);

  // ── Send image to FaceMesh ────────────────────────────────────────
  const sendToFaceMesh = useCallback(async (img: HTMLImageElement) => {
    if (!faceMeshRef.current) {
      setError('AI Engine belum siap. Tunggu sebentar lalu coba lagi.');
      updateStatus('detecting');
      return;
    }
    try {
      await faceMeshRef.current.send({ image: img });
    } catch (err) {
      console.error('FaceMesh send error:', err);
      setError('Gagal memproses gambar. Coba lagi.');
      updateStatus('detecting');
    }
  }, [updateStatus]);

  // ── Camera mode ───────────────────────────────────────────────────
  const startCamera = useCallback(() => {
    setMode('camera');
    setFaceData(null);
    setRecommendations(null);
    setImageUrl(null);
    setError(null);
    setFilteredProducts([]);
    updateStatus('detecting');
  }, [updateStatus]);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const shot = webcamRef.current.getScreenshot();
    if (!shot) return;

    setImageUrl(shot);
    setError(null);
    updateStatus('analyzing'); // statusRef.current is now 'analyzing'

    const img = new Image();
    img.src = shot;
    img.onload = () => sendToFaceMesh(img);
  }, [updateStatus, sendToFaceMesh]);

  // ── Upload mode ───────────────────────────────────────────────────
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMode('upload');
    setFaceData(null);
    setRecommendations(null);
    setError(null);
    setFilteredProducts([]);

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    updateStatus('analyzing'); //  statusRef.current is now 'analyzing'

    const img = new Image();
    img.src = url;
    img.onload = () => sendToFaceMesh(img);
  }, [updateStatus, sendToFaceMesh]);

  // ── Reset ─────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setMode(null);
    setFaceData(null);
    setImageUrl(null);
    setError(null);
    setRecommendations(null);
    setFilteredProducts([]);
    updateStatus('idle');
  }, [updateStatus]);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 p-4 md:p-8">
      {/* MediaPipe CDN Scripts */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(true)}
      />

      {/* ── Header ── */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-dark text-xs font-bold tracking-widest uppercase">
          <Sparkles className="w-3 h-3" /> AI-Powered Grooming
        </div>
        <h1 className="heading-xl tracking-tight">Face Architect</h1>
        <p className="text-surface-sub max-w-2xl mx-auto text-lg">
          Ambil foto wajah Anda untuk mendapatkan analisis geometri dan rekomendasi gaya rambut yang presisi.
        </p>

        {/* Loading indicator while MediaPipe warms up */}
        {!scriptsLoaded && (
          <p className="text-xs text-surface-sub animate-pulse">
            Memuat AI Engine...
          </p>
        )}

        <div className="flex justify-center gap-4 pt-4 flex-wrap">
          {!mode && (
            <>
              <button
                onClick={startCamera}
                disabled={!scriptsLoaded}
                className="btn-primary flex items-center gap-2 px-8 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" /> Gunakan Kamera
              </button>
              <label
                className={`btn-secondary flex items-center gap-2 px-8 py-4 cursor-pointer ${!scriptsLoaded ? 'opacity-40 pointer-events-none' : ''
                  }`}
              >
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

          {mode === 'camera' && status === 'detecting' && (
            <button
              onClick={capturePhoto}
              className="btn-primary flex items-center gap-2 px-12 py-4"
            >
              <Scan className="w-5 h-5" /> Ambil & Analisis Wajah
            </button>
          )}

          {(status === 'done' ||
            (mode && status !== 'detecting' && status !== 'analyzing')) && (
              <button
                onClick={reset}
                className="btn-secondary flex items-center gap-2 px-8 py-4"
              >
                <RefreshCcw className="w-4 h-4" /> Reset Analisis
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

      {/* ── Viewport ── */}
      <div className="relative max-w-3xl mx-auto aspect-[4/3] bg-surface-raised border border-surface-muted rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">

        {/* Idle placeholder */}
        {status === 'idle' && (
          <div className="text-surface-sub flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-surface/50 flex items-center justify-center mb-6">
              <Camera className="w-10 h-10 opacity-40" />
            </div>
            <p className="label-upper tracking-widest">Siap Menganalisis</p>
          </div>
        )}

        {/* Analyzing overlay */}
        {status === 'analyzing' && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-accent/20 border-t-accent-dark rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-accent-dark animate-pulse" />
            </div>
            <p className="mt-8 text-surface-ink font-bold tracking-[0.2em] uppercase text-sm animate-pulse">
              Menganalisis Struktur...
            </p>
          </div>
        )}

        {/* Live webcam feed */}
        {mode === 'camera' && status === 'detecting' && (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={WEBCAM_CONFIG}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
        )}

        {/* Captured / uploaded image */}
        {imageUrl && (status === 'analyzing' || status === 'done') && (
          <img
            src={imageUrl}
            alt="Captured"
            style={{ objectFit: 'cover' }}
            className={`absolute inset-0 w-full h-full ${mode === 'camera' ? 'scale-x-[-1]' : ''}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Landmark canvas overlay */}
        <canvas
          ref={canvasRef}
          style={{ objectFit: 'cover' }}
          className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-700 ${
            status === 'done' ? 'opacity-100' : 'opacity-0'
          } ${mode === 'camera' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Scanner sweep animation */}
        {status === 'detecting' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/40 shadow-[0_0_15px_rgba(181,135,42,0.5)] animate-scan" />
          </div>
        )}

        {/* Face shape result badge — overlaid on image */}
        {status === 'done' && faceData && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-dark flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight">{faceData.shape}</p>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
                  Bentuk Wajah Terdeteksi
                </p>
              </div>
            </div>
            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-4 py-3 text-right">
              <p className="text-accent-light font-bold text-lg">
                {(faceData.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
                Confidence
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Results Section ── */}
      {status === 'done' && faceData && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column: shape card + ratios + styles */}
            <div className="md:col-span-1 space-y-6">

              {/* Shape result */}
              <div className="glass-card p-8 bg-accent/5 border-accent/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent-dark flex items-center justify-center text-white">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <p className="label-upper !mb-0">Hasil Analisis</p>
                </div>
                <h3 className="text-4xl font-black mb-3 tracking-tight text-accent-dark">
                  {faceData.shape}
                </h3>
                <p className="text-surface-sub leading-relaxed text-sm">{faceData.description}</p>
                <div className="pt-5 mt-5 border-t border-surface-muted/50">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-surface-sub uppercase tracking-wider text-xs">
                      AI Confidence
                    </span>
                    <span className="text-accent-dark font-bold">
                      {(faceData.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-muted h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-accent-dark h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${faceData.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Geometric ratios */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-4 h-4 text-surface-sub" />
                  <p className="label-upper !mb-0">Proporsi Wajah</p>
                </div>
                <div className="space-y-4">
                  {[
                    { 
                      label: 'Panjang Wajah', 
                      desc: faceData.measurements.lengthToWidthRatio >= 1.4 ? 'Cenderung Panjang' : faceData.measurements.lengthToWidthRatio <= 1.25 ? 'Cenderung Pendek' : 'Proporsional',
                      percent: Math.min(100, Math.max(0, ((faceData.measurements.lengthToWidthRatio - 1.0) / 0.6) * 100))
                    },
                    { 
                      label: 'Lebar Dahi', 
                      desc: faceData.measurements.foreheadToWidthRatio >= 0.82 ? 'Relatif Lebar' : 'Cenderung Sempit',
                      percent: faceData.measurements.foreheadToWidthRatio * 100
                    },
                    { 
                      label: 'Garis Rahang', 
                      desc: faceData.measurements.jawToWidthRatio >= 0.82 ? 'Kuat & Tegas' : faceData.measurements.jawToWidthRatio <= 0.76 ? 'Tirus / V-Shape' : 'Halus / Proporsional',
                      percent: faceData.measurements.jawToWidthRatio * 100
                    },
                  ].map((m) => (
                    <div key={m.label} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold tracking-widest text-surface-sub uppercase">{m.label}</span>
                        <span className="text-xs font-semibold text-accent-dark">{m.desc}</span>
                      </div>
                      <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent-dark h-full rounded-full opacity-80 transition-all duration-1000 ease-out" 
                          style={{ width: `${Math.min(100, m.percent)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended styles */}
              <div className="glass-card p-6">
                <p className="label-upper mb-4">Gaya Rambut Cocok</p>
                <div className="space-y-2">
                  {(recommendations?.recommendedStyles || faceData.recommendedStyles).map((s: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-surface-raised rounded-lg px-3 py-2"
                    >
                      <ChevronRight className="w-3 h-3 text-accent-dark shrink-0" />
                      <span className="font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: AI recommendation */}
            <div className="md:col-span-2">
              <RecommendationCard result={recommendations} faceShape={faceData.shape} />
            </div>
          </div>

          {/* Product recommendations */}
          <div className="space-y-8 pt-8">
            <div>
              <h3 className="heading-md tracking-tight">Rekomendasi Produk Styling</h3>
              <p className="text-surface-sub">
                Produk pilihan untuk memaksimalkan gaya rambut {faceData.shape} Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/catalog/${product.slug}`}
                    className="group bg-surface-raised border border-surface-muted rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-square relative overflow-hidden bg-surface-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <p className="text-[10px] uppercase tracking-widest text-surface-sub font-bold mb-1">
                        {product.category}
                      </p>
                      <h4 className="font-bold text-sm line-clamp-1 mb-2 group-hover:text-accent-dark transition-colors">
                        {product.name}
                      </h4>
                      <p className="mt-auto font-black text-accent-dark">
                        Rp {product.price?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </Link>
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
        </div>
      )}
    </div>
  );
}
