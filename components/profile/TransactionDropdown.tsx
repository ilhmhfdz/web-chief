'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Loader, Truck, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TransactionDropdown() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-surface rounded-xl border border-surface-muted overflow-hidden">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-brand-50 hover:bg-brand-100 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <span className="font-semibold text-brand-900 text-lg">Transaksi</span>
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-brand-700" />
        </motion.div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 border-t border-surface-muted bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-brand-900 text-lg">Pembelian</h3>
                <Link href="#" className="text-brand-500 hover:text-brand-700 text-sm font-medium transition-colors">
                  Lihat Semua
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Menunggu Pembayaran */}
                <Link href="#" className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-brand-50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-brand-200">
                    <Clock className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center text-brand-800">
                    Menunggu<br/>Pembayaran
                  </span>
                </Link>

                {/* Menunggu Konfirmasi */}
                <Link href="#" className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-brand-50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-brand-200">
                    <Loader className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center text-brand-800">
                    Pesanan<br/>Diproses
                  </span>
                </Link>

                {/* Sedang Dikirim */}
                <Link href="#" className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-brand-50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-brand-200">
                    <Truck className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center text-brand-800">
                    Sedang<br/>Dikirim
                  </span>
                </Link>

                {/* Sampai Tujuan */}
                <Link href="#" className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-brand-50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-brand-200">
                    <MapPin className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center text-brand-800">
                    Sampai<br/>Tujuan
                  </span>
                </Link>
                
                {/* Selesai */}
                <Link href="#" className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-brand-50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors border border-brand-200">
                    <CheckCircle className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center text-brand-800">
                    Selesai
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
