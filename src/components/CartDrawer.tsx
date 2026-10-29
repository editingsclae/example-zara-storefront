"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/medusa";
import { X, Trash2, Package, ShoppingBag, ArrowRight } from "lucide-react";

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  // Close when route changes
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  // Handle open/close side-effects: body scroll lock and focus management
  useEffect(() => {
    if (isCartOpen) {
      wasOpenRef.current = true;
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Small delay to ensure drawer DOM is mounted before focusing
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    } else if (wasOpenRef.current) {
      // Only after the drawer was open: return focus to the header cart button
      // or the previous element. Doing it on the first render would pull focus
      // to the cart button on every page load.
      wasOpenRef.current = false;
      const cartBtn = document.getElementById("header-cart-button");
      if (cartBtn) {
        cartBtn.focus();
      } else if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    }
  }, [isCartOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const items = cart?.items || [];
  const currencyCode = cart?.currency_code || "TND";
  const subtotal = cart?.item_subtotal ?? cart?.subtotal ?? 0;

  const handleUpdateQuantity = async (lineItemId: string, newQty: number) => {
    setLineErrors((prev) => {
      const copy = { ...prev };
      delete copy[lineItemId];
      return copy;
    });
    setBusyLineId(lineItemId);
    try {
      await updateQuantity(lineItemId, newQty);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to update quantity.";
      setLineErrors((prev) => ({ ...prev, [lineItemId]: msg }));
    } finally {
      setBusyLineId(null);
    }
  };

  const handleRemoveItem = async (lineItemId: string) => {
    setLineErrors((prev) => {
      const copy = { ...prev };
      delete copy[lineItemId];
      return copy;
    });
    setBusyLineId(lineItemId);
    try {
      await removeItem(lineItemId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to remove item.";
      setLineErrors((prev) => ({ ...prev, [lineItemId]: msg }));
    } finally {
      setBusyLineId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Right-side sliding panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-zinc-800" />
            <h2 className="text-base font-bold text-zinc-900">Shopping Cart</h2>
            <span className="text-xs font-mono text-zinc-500">
              ({items.reduce((acc, i) => acc + (i.quantity || 0), 0)})
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="p-1.5 rounded-md text-zinc-500 hover:text-black hover:bg-zinc-100 transition focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items List / Empty State */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">Your cart is empty</h3>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Looks like you haven&apos;t added any items yet.
                </p>
              </div>
              <Link
                href="/shop"
                onClick={closeCart}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-md text-xs font-semibold hover:bg-black transition"
              >
                <span>Continue shopping</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => {
                const isBusy = busyLineId === item.id;
                const lineTotal = item.subtotal || item.unit_price * item.quantity;
                const errorMsg = lineErrors[item.id];

                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 bg-zinc-100 rounded-md overflow-hidden shrink-0 border border-zinc-100 flex items-center justify-center">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-zinc-400" />
                        )}
                      </div>

                      {/* Info & Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-900 truncate">
                              {item.title}
                            </h4>
                            {item.variant_title && item.variant_title !== "Default Variant" && (
                              <p className="text-[11px] text-zinc-500 truncate">
                                {item.variant_title}
                              </p>
                            )}
                            <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
                              {formatPrice(item.unit_price, currencyCode)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isBusy}
                            title="Remove item"
                            aria-label={`Remove ${item.title}`}
                            className="p-1 text-zinc-400 hover:text-rose-600 disabled:opacity-30 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Stepper & Line total */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-zinc-200 rounded bg-zinc-50 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={isBusy || item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="px-2 py-0.5 text-zinc-600 hover:text-black hover:bg-zinc-200 font-bold disabled:opacity-30 transition"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 font-semibold font-mono text-center min-w-6 bg-white text-zinc-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isBusy}
                              aria-label="Increase quantity"
                              className="px-2 py-0.5 text-zinc-600 hover:text-black hover:bg-zinc-200 font-bold disabled:opacity-30 transition"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold font-mono text-zinc-900">
                            {formatPrice(lineTotal, currencyCode)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Inline error for this line if stock or API error occurs */}
                    {errorMsg && (
                      <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                        {errorMsg}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700">Subtotal</span>
              <span className="font-bold font-mono text-base text-zinc-900">
                {formatPrice(subtotal, currencyCode)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-tight">
              Delivery is calculated at checkout. Payment on delivery.
            </p>

            <div className="space-y-2 pt-1">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 text-white rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-black transition shadow-sm"
              >
                <span>Checkout</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full flex items-center justify-center py-2 px-4 border border-zinc-300 bg-white text-zinc-700 rounded-md text-xs font-semibold hover:bg-zinc-100 transition"
              >
                View cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
