'use client';

import { useState, useCallback, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import CartDrawer from '@/components/shop/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cart button that lives in the Navbar.
 * IMP-004: Adds bounce animation when new item added to cart.
 */
export default function CartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const { totalItems } = useCart();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // IMP-004: Trigger bounce animation when totalItems increases
  const prevItems = useState(totalItems);
  useEffect(() => {
    if (totalItems > 0) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  const open = useCallback(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login?callbackUrl=/cart');
      return;
    }
    setIsOpen(true);
  }, [isLoading, user, router]);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        onClick={open}
        className="btn-ghost relative p-2"
        aria-label={`Keranjang belanja — ${totalItems} item`}
      >
        <motion.div
          animate={bounce ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ShoppingBag className="w-5 h-5 text-surface-ink" />
        </motion.div>
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 rounded-full bg-surface-ink text-white text-[10px] font-bold leading-none"
            >
              {totalItems > 9 ? '9+' : totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <CartDrawer isOpen={isOpen} onClose={close} />
    </>
  );
}
