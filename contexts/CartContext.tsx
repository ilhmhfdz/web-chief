'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { CartItem, CartState, Product } from '@/types/product';

// ============================================================
// State & Actions
// ============================================================

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.product._id === action.product._id);
      if (existing) {
        return state.map((i) =>
          i.product._id === action.product._id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.product.stock) }
            : i
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }

    case 'REMOVE_ITEM':
      return state.filter((i) => i.product._id !== action.productId);

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return state.filter((i) => i.product._id !== action.productId);
      }
      return state.map((i) =>
        i.product._id === action.productId
          ? { ...i, quantity: Math.min(action.quantity, i.product.stock) }
          : i
      );
    }

    case 'CLEAR_CART':
      return [];

    case 'HYDRATE':
      return action.items;

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'chief-cart';

// ============================================================
// Provider
// ============================================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch {
      // Corrupted storage — ignore
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Memoised derived values
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  // Stable action callbacks
  const addItem = useCallback(
    (product: Product) => dispatch({ type: 'ADD_ITEM', product }),
    []
  );
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }),
    []
  );
  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const isInCart = useCallback(
    (productId: string) => items.some((i) => i.product._id === productId),
    [items]
  );

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((i) => i.product._id === productId)?.quantity ?? 0,
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getQuantity,
    }),
    [items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, isInCart, getQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================================
// Hook — must be used inside <CartProvider>
// ============================================================

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return ctx;
}
