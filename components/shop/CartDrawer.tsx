'use client';

import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, PackageX, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils/format';
import type { CartItem } from '@/types/product';
import { toast } from 'sonner';

// ============================================================
// Cart Line Item
// ============================================================

function CartLineItem({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 p-3 bg-white rounded-lg border border-surface-muted hover:border-surface-border transition-colors"
    >
      {/* Thumbnail */}
      <Link
        href={`/catalog/${item.product.slug}`}
        className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-surface-raised border border-surface-muted block"
      >
        <Image
          src={item.product.image_url}
          alt={item.product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        <Link
          href={`/catalog/${item.product.slug}`}
          className="text-sm font-semibold text-surface-ink hover:underline underline-offset-2 line-clamp-2 leading-snug"
        >
          {item.product.name}
        </Link>
        <p className="text-xs text-surface-sub capitalize">{item.product.category}</p>

        {/* Quantity + Remove row */}
        <div className="flex items-center justify-between mt-auto">
          {/* Qty controls */}
          <div className="flex items-center gap-0 border border-surface-muted rounded overflow-hidden">
            <button
              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors"
              aria-label="Kurangi"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-surface-ink border-x border-surface-muted">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product._id, Math.min(item.quantity + 1, item.product.stock))}
              disabled={item.quantity >= item.product.stock}
              className="w-7 h-7 flex items-center justify-center text-surface-sub hover:text-surface-ink hover:bg-surface-raised transition-colors disabled:opacity-30"
              aria-label="Tambah"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-bold text-surface-ink">
            {formatPrice(item.product.price * item.quantity)}
          </p>

          {/* Remove */}
          <button
            onClick={() => removeItem(item.product._id)}
            className="w-7 h-7 flex items-center justify-center text-surface-border hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            aria-label={`Hapus ${item.product.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Empty Cart
// ============================================================

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 py-16 text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-surface-raised border border-surface-muted flex items-center justify-center">
        <ShoppingCart className="w-9 h-9 text-surface-border" />
      </div>
      <div>
        <p className="font-semibold text-surface-ink text-base">Keranjang masih kosong</p>
        <p className="text-sm text-surface-sub mt-1.5 leading-relaxed">
          Belum ada produk yang ditambahkan.<br />Yuk mulai belanja!
        </p>
      </div>
      <Link
        href="/catalog"
        onClick={onClose}
        className="btn-primary text-sm"
      >
        <ShoppingBag className="w-4 h-4" />
        Lihat Katalog
      </Link>
    </div>
  );
}

// ============================================================
// Main CartDrawer
// ============================================================

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPrice, clearCart, addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  /** Auth-gated checkout navigation */
  const handleCheckout = useCallback(() => {
    onClose();
    if (!user) {
      router.push('/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  }, [user, router, onClose]);

  // BUG-015: Confirm clear cart with Undo toast
  const handleClearCart = useCallback(() => {
    const previousItems = [...items];
    clearCart();
    toast.success('Keranjang dikosongkan', {
      description: `${previousItems.length} jenis item dihapus.`,
      action: {
        label: 'Batal',
        onClick: () => {
          // Restore items
          previousItems.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
              addItem(item.product);
            }
          });
          toast('Dikembalikan ke keranjang');
        }
      },
      duration: 5000,
    });
  }, [items, clearCart, addItem]);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="cart-panel"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang belanja"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full z-[70] w-full max-w-[400px] flex flex-col bg-surface shadow-2xl"
            style={{ height: '100dvh' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-surface-muted shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-surface-ink" />
                <h2 className="font-display font-bold text-surface-ink text-base tracking-tight">
                  Keranjang
                </h2>
                {totalItems > 0 && (
                  <span className="text-[11px] font-bold bg-surface-ink text-white px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-surface-sub hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors font-medium"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-raised transition-colors text-surface-sub hover:text-surface-ink"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Body (scrollable) ── */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-surface-raised">
              {items.length === 0 ? (
                <EmptyCart onClose={onClose} />
              ) : (
                <motion.div layout className="flex flex-col gap-2.5 p-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLineItem key={item.product._id} item={item} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* ── Footer ── */}
            {items.length > 0 && (
              <div className="bg-white border-t border-surface-muted px-5 py-4 space-y-3 shrink-0">
                {/* Subtotal rows */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-surface-sub">
                    <span>{totalItems} item</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-surface-sub">
                    <span>Pengiriman</span>
                    <span className="text-green-600 font-semibold">Dihitung di checkout</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-surface-muted pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-surface-ink">Total</span>
                    <span className="text-lg font-bold text-surface-ink font-display">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full justify-center text-sm py-3"
                  >
                    Lanjut ke Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full text-center text-xs text-surface-sub hover:text-surface-ink mt-2 py-1 transition-colors"
                  >
                    Lanjut belanja
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
