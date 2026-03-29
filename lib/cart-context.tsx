'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface CartContextValue {
  cartIds: Set<number>;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  toggleCart: (id: number) => void;
  addSet: (ids: number[]) => void;
  clearCart: () => void;
  removeMany: (ids: number[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartIds, setCartIds] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cart');
      if (stored) setCartIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      sessionStorage.setItem('cart', JSON.stringify([...cartIds]));
    }
  }, [cartIds, hydrated]);

  const addToCart = useCallback((id: number) => {
    setCartIds((prev) => { const next = new Set(prev); next.add(id); return next; });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const toggleCart = useCallback((id: number) => {
    setCartIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const addSet = useCallback((ids: number[]) => {
    setCartIds((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      if (allIn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const removeMany = useCallback((ids: number[]) => {
    setCartIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCartIds(new Set()), []);

  return (
    <CartContext.Provider value={{ cartIds, addToCart, removeFromCart, toggleCart, addSet, clearCart, removeMany }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
