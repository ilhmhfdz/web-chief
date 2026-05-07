'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight, Home, MessageCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

// Inner component that uses useSearchParams
function OrderSuccessContent() {
  const { clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  // Clear cart once after successful order
  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!orderId) {
    router.replace('/catalog');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md text-center"
    >
      {/* Checkmark animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </motion.div>

      <h1 className="heading-lg mb-3">Pesanan Diterima!</h1>
      <p className="text-surface-sub mb-2">Terima kasih sudah berbelanja di Chief Supplies.</p>

      <div className="glass-card px-6 py-4 mb-6 inline-block">
        <p className="text-xs text-surface-sub uppercase tracking-wider mb-1">ID Pesanan</p>
        <p className="font-mono text-sm font-semibold text-surface-ink">{orderId}</p>
      </div>

      {/* BUG-011: Better post-order guidance with tracking steps */}
      <div className="glass-card p-5 mb-6 text-left space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-surface-ink">Konfirmasi Pembayaran</p>
            <p className="text-xs text-surface-sub mt-0.5">Tim kami akan menghubungi Anda via WhatsApp dalam 1×2 jam untuk konfirmasi pembayaran.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MessageCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-surface-ink">Hubungi Kami Langsung</p>
            <p className="text-xs text-surface-sub mt-0.5">Ada pertanyaan tentang pesanan ini? Chat tim Chief Supplies sekarang.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
        <a
          href={`https://wa.me/628123456789?text=Halo%20Chief%20Supplies%2C%20saya%20ingin%20konfirmasi%20pesanan%20ID%3A%20${orderId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <MessageCircle className="w-4 h-4" />
          Konfirmasi via WhatsApp
        </a>
        <Link href="/" className="btn-secondary">
          <Home className="w-4 h-4" />
          Beranda
        </Link>
        <Link href="/catalog" className="btn-ghost">
          <ShoppingBag className="w-4 h-4" />
          Lanjut Belanja
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center section-container py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-surface-sub" />
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}
