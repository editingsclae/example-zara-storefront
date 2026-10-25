"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Cart,
  getCart,
  createCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
} from "@/lib/medusa";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  addToCart: (variantId: string, quantity?: number) => Promise<Cart>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<Cart>;
  removeItem: (lineItemId: string) => Promise<Cart>;
  refreshCart: () => Promise<Cart | null>;
  clearCart: () => void;
  ensureCart: () => Promise<Cart>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "medusa_cart_id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const setCartId = (id: string | null) => {
    if (id) {
      localStorage.setItem(CART_KEY, id);
      document.cookie = `${CART_KEY}=${id}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(CART_KEY);
      document.cookie = `${CART_KEY}=; path=/; max-age=0`;
    }
  };

  const getSavedCartId = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CART_KEY);
  };

  const ensureCart = useCallback(async (): Promise<Cart> => {
    const savedId = getSavedCartId();
    if (savedId) {
      try {
        const existing = await getCart(savedId, token || undefined);
        if (existing && !existing.items) {
          existing.items = [];
        }
        if (existing) {
          setCart(existing);
          return existing;
        }
      } catch (err) {
        console.warn("Stored cart invalid or gone, recreating...", err);
      }
    }

    // Recreate fresh cart
    const fresh = await createCart(token || undefined);
    setCartId(fresh.id);
    setCart(fresh);
    return fresh;
  }, [token]);

  const refreshCart = useCallback(async (): Promise<Cart | null> => {
    const savedId = getSavedCartId();
    if (!savedId) return null;
    try {
      const refreshed = await getCart(savedId, token || undefined);
      if (refreshed) {
        setCart(refreshed);
        return refreshed;
      } else {
        setCartId(null);
        setCart(null);
        return null;
      }
    } catch {
      setCartId(null);
      setCart(null);
      return null;
    }
  }, [token]);

  // Load cart on initial mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const savedId = getSavedCartId();
        if (savedId) {
          const loaded = await getCart(savedId, token || undefined);
          if (loaded) {
            setCart(loaded);
          } else {
            setCartId(null);
            setCart(null);
          }
        }
      } catch (err) {
        console.warn("Failed to load initial cart:", err);
        setCartId(null);
        setCart(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [token]);

  const addToCart = async (
    variantId: string,
    quantity = 1
  ): Promise<Cart> => {
    setIsLoading(true);
    try {
      const activeCart = cart || (await ensureCart());
      const updated = await apiAddToCart(
        activeCart.id,
        variantId,
        quantity,
        token || undefined
      );
      setCart(updated);
      setCartId(updated.id);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (
    lineItemId: string,
    quantity: number
  ): Promise<Cart> => {
    if (!cart) throw new Error("No active cart");
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        return await removeItem(lineItemId);
      }
      const updated = await apiUpdateCartItem(
        cart.id,
        lineItemId,
        quantity,
        token || undefined
      );
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineItemId: string): Promise<Cart> => {
    if (!cart) throw new Error("No active cart");
    setIsLoading(true);
    try {
      const updated = await apiRemoveCartItem(
        cart.id,
        lineItemId,
        token || undefined
      );
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCartId(null);
    setCart(null);
  };

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
        clearCart,
        ensureCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
