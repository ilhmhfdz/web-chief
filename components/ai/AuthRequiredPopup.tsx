'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface AuthRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthRequiredPopup({ isOpen, onClose }: AuthRequiredPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-surface-ink to-surface-ink/90 text-white text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Login Diperlukan</h2>
                <p className="text-white/70 text-sm mt-1">
                  Fitur AI eksklusif untuk member Chief
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                <p className="text-sm text-surface-sub text-center leading-relaxed">
                  Untuk menggunakan <strong className="text-surface-ink">Face Architect Visual</strong>, kamu perlu login atau daftar terlebih dulu.
                </p>

                {/* Benefits */}
                <ul className="space-y-2.5">
                  {[
                    { icon: '✦', text: 'Dapatkan 1 credit gratis saat mendaftar' },
                    { icon: '✦', text: 'Generate analisis gaya rambut dengan AI' },
                    { icon: '✦', text: 'Credit baru otomatis setiap pembelian' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-surface-sub">
                      <span className="text-accent-dark font-bold shrink-0">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="w-full btn-primary py-3.5 font-semibold text-center rounded-xl flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login Sekarang
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="w-full btn-secondary py-3.5 font-semibold text-center rounded-xl flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Daftar Gratis — Dapat 1 Credit
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
