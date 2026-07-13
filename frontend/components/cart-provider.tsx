'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product, Variant } from '@/lib/catalog';

export type CartItem = {
  product: Pick<Product, 'id' | 'slug' | 'name' | 'image'>;
  variant: Variant;
  quantity: number;
  reservationId?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  sessionId: string;
  addItem: (product: Product, variant: Variant, quantity?: number, reservationId?: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ghanastyle-cart');
    const existingSession = localStorage.getItem('ghanastyle-session');
    setSessionId(existingSession || crypto.randomUUID());
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { localStorage.removeItem('ghanastyle-cart'); }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !sessionId) return;
    localStorage.setItem('ghanastyle-cart', JSON.stringify(items));
    localStorage.setItem('ghanastyle-session', sessionId);
  }, [items, ready, sessionId]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0),
    sessionId,
    addItem(product, variant, quantity = 1, reservationId) {
      setItems((current) => {
        const found = current.find((item) => item.variant.id === variant.id);
        if (found) return current.map((item) => item.variant.id === variant.id ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { product: { id: product.id, slug: product.slug, name: product.name, image: product.image }, variant, quantity, reservationId }];
      });
    },
    updateQuantity(variantId, quantity) {
      if (quantity < 1) return;
      setItems((current) => current.map((item) => item.variant.id === variantId ? { ...item, quantity: Math.min(quantity, item.variant.stock) } : item));
    },
    removeItem(variantId) { setItems((current) => current.filter((item) => item.variant.id !== variantId)); },
    clear() { setItems([]); },
  }), [items, sessionId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
