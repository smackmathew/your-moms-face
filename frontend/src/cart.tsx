import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "./types";

const KEY = "ymf-cart";
const MAX_QUANTITY = 20;

interface Cart {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, variantId: number, quantity: number) => void;
  remove: (productId: string, variantId: number) => void;
  clear: () => void;
}

const CartContext = createContext<Cart | null>(null);

function load(): CartLine[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const same = (l: CartLine, productId: string, variantId: number) => l.productId === productId && l.variantId === variantId;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable; the cart lasts for this visit only
    }
  }, [lines]);

  const cart = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.quantity * l.priceCents, 0),
      add: (line) =>
        setLines((prev) => {
          const existing = prev.find((l) => same(l, line.productId, line.variantId));
          if (!existing) return [...prev, { ...line, quantity: Math.min(line.quantity, MAX_QUANTITY) }];
          return prev.map((l) =>
            l === existing ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_QUANTITY) } : l,
          );
        }),
      setQuantity: (productId, variantId, quantity) =>
        setLines((prev) =>
          prev.map((l) =>
            same(l, productId, variantId) ? { ...l, quantity: Math.max(1, Math.min(quantity, MAX_QUANTITY)) } : l,
          ),
        ),
      remove: (productId, variantId) => setLines((prev) => prev.filter((l) => !same(l, productId, variantId))),
      clear: () => setLines([]),
    }),
    [lines],
  );

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
