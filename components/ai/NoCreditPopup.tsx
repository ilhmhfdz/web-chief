'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ShoppingBag, Package, Zap } from 'lucide-react';
import Link from 'next/link';

interface NoCreditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining?: number;
}

export default function NoCreditPopup({ isOpen, onClose, creditsRemaining = 0 }: NoCreditPopupProps) {
  const steps = [
    { icon: ShoppingBag, label: 'Belanja produk Chief', desc: 'Pilih produk favoritmu di katalog' },
    { icon: Package,     label: 'Pesanan diterima',     desc: 'Tunggu sampai status "Terkirim"' },
    { icon: Zap,         label: 'Credit otomatis +1',   desc: 'Langsung bisa generate lagi!' },
  ];

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
              <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-accent-dark to-accent text-white text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Credit Habis</h2>
                <p className="text-white/70 text-sm mt-1">
                  Kamu sudah menggunakan 1 credit gratis
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                {/* Credit badge */}
                <div className="flex items-center justify-center gap-3 py-3 bg-surface-raised rounded-xl border border-surface-muted">
                  <Sparkles className="w-5 h-5 text-surface-border" />
                  <span className="text-sm text-surface-sub">Credit kamu saat ini:</span>
                  <span className="text-xl font-bold text-surface-ink">{creditsRemaining}</span>
                </div>

                {/* Steps */}
                <div>
                  <p className="text-xs font-semibold text-surface-sub uppercase tracking-wider mb-3">
                    Cara mendapatkan credit baru
                  </p>
                  <div className="space-y-3">
                    {steps.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-surface-ink text-white flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-ink">{step.label}</p>
                            <p className="text-xs text-surface-sub">{step.desc}</p>
                          </div>
                          {i < steps.length - 1 && (
                            <div className="hidden" /> // visual connector handled by spacing
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-3 pt-1">
                  <Link
                    href="/catalog"
                    onClick={onClose}
                    className="w-full btn-primary py-3.5 font-semibold text-center rounded-xl flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Belanja Sekarang
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm text-surface-sub hover:text-surface-ink transition-colors font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
