'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  const WA_LINK = 'https://wa.me/6285121571837?text=Halo%20Chief%20Supplies!';

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-4 z-[55] flex flex-col items-end gap-3 lg:bottom-6 lg:right-6 cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-surface-muted rounded-xl px-4 py-3 max-w-[220px] shadow-lg shadow-black/5 pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-bold text-surface-ink">Chat dengan kami</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-surface-sub hover:text-surface-ink transition-colors"
                aria-label="Tutup"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-surface-sub leading-relaxed">
              Tanya produk, cek stok, atau konsultasi gratis via WhatsApp.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onClick={(e) => {
          // If dragging, don't open the link
          // Framer motion drag usually handles this, but we want to be safe
        }}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all duration-200"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full border-2 border-green-600/40 animate-ping pointer-events-none" />
      </a>
    </motion.div>
  );
}
