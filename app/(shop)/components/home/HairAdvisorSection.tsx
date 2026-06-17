'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Sparkles, Send, RotateCcw, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import ProductCardAI, { cardVariants } from '@/components/shop/ProductCardAI';
import type { HairAdvisorRecommendation } from '@/app/api/ai/hair-advisor/route';

// ── Quick-fill condition chips ───────────────────────────────────────────────
const CONDITION_CHIPS = [
  { label: '💧 Berminyak', value: 'Rambut saya berminyak dan kulit kepala terasa berminyak setelah sehari' },
  { label: '❄️ Ketombe', value: 'Kepala saya sering berketombe dan gatal di kulit kepala' },
  { label: '🌵 Rambut Kering', value: 'Rambut saya kering, kusut, dan susah diatur setelah keramas' },
  { label: '🍂 Rontok', value: 'Rambut saya sering rontok berlebihan saat keramas atau menyisir' },
  { label: '⚡ Kasar & Frizzy', value: 'Rambut saya kasar, mengembang, dan sulit diatur dengan pomade biasa' },
  { label: '🔴 Kulit Kepala Sensitif', value: 'Kulit kepala saya sensitif, mudah iritasi dan merah saat pakai produk baru' },
];

// ── Framer Motion container variant (stagger children cards) ─────────────────
// Based on Context7 Framer Motion docs — variants with staggerChildren pattern
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.12,
      when: 'beforeChildren' as const,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 as const },
  },
};

// ── Section reveal animation ─────────────────────────────────────────────────
const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

type UIState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HairAdvisorSection() {
  const [condition, setCondition] = useState('');
  const [uiState, setUiState] = useState<UIState>('idle');
  const [recommendations, setRecommendations] = useState<HairAdvisorRecommendation[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const MAX_CHARS = 500;
  const charCount = condition.length;
  const isOverLimit = charCount > MAX_CHARS;

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCondition(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  // ── Chip quick-fill ────────────────────────────────────────────────────────
  const handleChip = useCallback((chip: typeof CONDITION_CHIPS[0]) => {
    setCondition(chip.value);
    setActiveChip(chip.label);
    textareaRef.current?.focus();
  }, []);

  // ── Submit to API ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = condition.trim();
    if (!trimmed || trimmed.length < 5 || isOverLimit) return;

    setUiState('loading');
    setRecommendations([]);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/hair-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Terjadi kesalahan. Silakan coba lagi.');
        setUiState('error');
        return;
      }

      if (!data.recommendations || data.recommendations.length === 0) {
        setUiState('empty');
        return;
      }

      setRecommendations(data.recommendations);
      setUiState('results');

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch {
      setErrorMsg('Koneksi gagal. Periksa internet Anda dan coba lagi.');
      setUiState('error');
    }
  }, [condition, isOverLimit]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setCondition('');
    setUiState('idle');
    setRecommendations([]);
    setErrorMsg('');
    setActiveChip(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  // ── Enter to submit ────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.section
      ref={sectionRef}
      id="hair-advisor"
      variants={sectionVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="section-container py-24 lg:py-32"
      aria-label="AI Hair Condition Advisor"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
        <div className="max-w-2xl">
          {/* Eyebrow label */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-[1px] bg-[#c0bdb7]" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#8e8b82] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              AI Hair Advisor
            </span>
          </div>

          {/* Heading — matches Premium Collection style */}
          <div className="leading-none">
            <h2 className="text-[3rem] lg:text-[4.5rem] font-bold text-[#1a1a1a] leading-none tracking-tight">
              Ceritakan
            </h2>
            <h2 className="text-[3rem] lg:text-[4.5rem] font-bold text-[#c0bdb7] leading-none tracking-tight -mt-1">
              Rambut Anda
            </h2>
          </div>

          <p className="mt-6 max-w-lg text-[#8e8b82] text-sm sm:text-base leading-relaxed tracking-wide font-medium">
            Deskripsikan kondisi rambut yang sedang Anda alami. AI kami akan menganalisis dan merekomendasikan produk yang paling tepat untuk kebutuhan Anda.
          </p>
        </div>

        {/* Decorative AI badge — desktop */}
        <div className="hidden lg:flex flex-col items-end gap-2 mb-1">
          <div className="flex items-center gap-2 border border-[#e8e4dc] bg-[#faf9f6] px-4 py-2.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-[#1a1a1a] tracking-wide uppercase">AI Aktif</span>
          </div>
          <p className="text-[10px] text-[#8e8b82] tracking-[0.1em] uppercase">Powered by GPT-4o-mini</p>
        </div>
      </div>

      {/* ── Input Panel ── */}
      <div className="relative max-w-3xl mb-12">
        {/* Textarea container */}
        <div className={`
          relative bg-[#faf9f6] border transition-all duration-300 rounded-sm
          ${uiState === 'loading' ? 'border-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]' : 'border-[#e0dbd2] focus-within:border-[#1a1a1a] focus-within:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]'}
        `}>
          {/* Top label row */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[#eae6e0]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-[11px] font-bold text-[#8e8b82] uppercase tracking-[0.15em]">
              Kondisi Rambut Anda
            </span>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="hair-condition-input"
            value={condition}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={uiState === 'loading'}
            rows={3}
            className="w-full bg-transparent resize-none px-5 pt-4 pb-3 text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none disabled:opacity-50 leading-relaxed font-medium"
            placeholder="Contoh: rambut saya berminyak dan ada ketombe, setelah keramas 1 hari sudah terasa lepek lagi..."
            aria-label="Ceritakan kondisi rambut Anda"
            maxLength={600}
          />

          {/* Bottom action bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#eae6e0]">
            {/* Char counter */}
            <span className={`text-[11px] font-medium tabular-nums transition-colors ${
              isOverLimit ? 'text-red-500' : charCount > MAX_CHARS * 0.8 ? 'text-amber-500' : 'text-[#b5b0a8]'
            }`}>
              {charCount}/{MAX_CHARS}
            </span>

            <div className="flex items-center gap-3">
              {/* Hint */}
              <span className="hidden sm:block text-[10px] text-[#b5b0a8] tracking-wide">
                Ctrl+Enter untuk kirim
              </span>

              {/* Reset */}
              {(condition || uiState !== 'idle') && (
                <button
                  onClick={handleReset}
                  className="text-[11px] text-[#8e8b82] font-bold uppercase tracking-[0.1em] hover:text-[#1a1a1a] transition-colors flex items-center gap-1"
                  aria-label="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}

              {/* Submit */}
              <button
                id="hair-advisor-submit"
                onClick={handleSubmit}
                disabled={!condition.trim() || condition.trim().length < 5 || isOverLimit || uiState === 'loading'}
                className={`
                  flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-[0.12em] uppercase
                  transition-all duration-300 rounded-sm
                  ${uiState === 'loading'
                    ? 'bg-amber-100 text-amber-700 cursor-wait'
                    : !condition.trim() || condition.trim().length < 5 || isOverLimit
                      ? 'bg-[#e8e4dc] text-[#a09b93] cursor-not-allowed'
                      : 'bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.98]'
                  }
                `}
                aria-label="Cari rekomendasi produk"
              >
                {uiState === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Temukan Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Chip Suggestions ── */}
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Pilihan kondisi rambut cepat">
          {CONDITION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              id={`chip-${chip.label.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleChip(chip)}
              disabled={uiState === 'loading'}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold
                border tracking-[0.08em] transition-all duration-200 rounded-full
                disabled:opacity-50 disabled:cursor-not-allowed
                ${activeChip === chip.label
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] border-[#d6d2c9] hover:border-[#1a1a1a] hover:bg-[#faf9f6]'
                }
              `}
            >
              {chip.label}
              <ChevronRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Area ── */}
      <div ref={resultsRef}>
        <AnimatePresence mode="wait">

          {/* Loading skeleton */}
          {uiState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* AI "thinking" indicator */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-amber-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-[13px] text-[#8e8b82] font-medium">
                  AI sedang menganalisis kondisi rambut Anda dan mencocokkan produk terbaik…
                </p>
              </div>

              {/* Skeleton cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="h-3 w-28 bg-[#ede9e3] rounded-full" />
                    <div className="aspect-[4/5] bg-[#ede9e3] rounded-sm" />
                    <div className="h-2.5 w-full bg-[#ede9e3] rounded-full" />
                    <div className="h-2.5 w-2/3 bg-[#ede9e3] rounded-full" />
                    <div className="h-3.5 w-full bg-[#ede9e3] rounded-full" />
                    <div className="h-3 w-20 bg-[#ede9e3] rounded-full" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results grid */}
          {uiState === 'results' && recommendations.length > 0 && (
            <motion.div
              key="results"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#8e8b82]">
                      AI Menemukan {recommendations.length} Produk untuk Anda
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#b5b0a8] italic">
                    Berdasarkan: "{condition.slice(0, 70)}{condition.length > 70 ? '...' : ''}"
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-[#8e8b82] uppercase tracking-[0.1em] hover:text-[#1a1a1a] transition-colors border-b border-transparent hover:border-[#8e8b82] pb-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Cari ulang
                </button>
              </div>

              {/* Product cards grid — stagger via parent containerVariants */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {recommendations.map((rec, i) => (
                  <ProductCardAI key={rec.product._id} recommendation={rec} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {uiState === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#f0ece4] flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-[#b5b0a8]" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">
                Tidak ada produk yang cocok ditemukan
              </h3>
              <p className="text-sm text-[#8e8b82] max-w-sm mb-6 leading-relaxed">
                Coba deskripsikan kondisi rambut Anda dengan kata yang berbeda, atau jelajahi semua koleksi kami.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 border border-[#1a1a1a] text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  Coba Lagi
                </button>
                <a
                  href="/catalog"
                  className="px-5 py-2.5 bg-[#1a1a1a] text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#333] transition-colors"
                >
                  Lihat Semua Produk
                </a>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {uiState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-4 p-5 border border-red-200 bg-red-50 rounded-sm max-w-lg"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 mb-1">Gagal menganalisis</p>
                <p className="text-sm text-red-600">{errorMsg}</p>
                <button
                  onClick={handleSubmit}
                  className="mt-3 text-[11px] font-bold text-red-700 uppercase tracking-[0.1em] underline hover:no-underline"
                >
                  Coba Lagi
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.section>
  );
}
