"use client";

import React, { useState } from "react";
import { Product, ProductVariant, formatPrice } from "@/lib/medusa";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, AlertCircle } from "lucide-react";
import {
  choose,
  findVariant,
  initialSelection,
  optionGroups,
  valueState,
  type Selection,
} from "@/lib/variant-select";

interface ProductDetailsClientProps {
  product: Product;
}

export function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const variants = product.variants || [];

  // One row of buttons per option (Size, Color...). Products whose variants have
  // no options to choose from keep the plain list of variants below.
  const groups = optionGroups(product);
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product, optionGroups(product))
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVariant =
    groups.length > 0
      ? findVariant(product, groups, selection) || variants[0]
      : variants.find((v) => v.id === selectedVariantId) || variants[0];

  const price = selectedVariant?.calculated_price;
  const inventory = selectedVariant?.inventory_quantity;
  const isOutOfStock = inventory !== undefined && inventory <= 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    setErrorMessage(null);

    try {
      await addToCart(selectedVariant.id, quantity);
    } catch (err: unknown) {
      console.error("Failed to add to cart:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        msg || "Failed to add product to cart. Please try again."
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
          {price
            ? formatPrice(price.calculated_amount, price.currency_code)
            : "Price unavailable"}
        </span>
        {price?.original_amount &&
          price.original_amount > price.calculated_amount && (
            <span className="text-sm text-zinc-400 line-through">
              {formatPrice(price.original_amount, price.currency_code)}
            </span>
          )}
      </div>

      {/* Stock Status Badge */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={14} />
            Out of stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {inventory !== undefined ? `${inventory} items available in stock` : "In stock"}
          </span>
        )}
      </div>

      {/* One row of buttons per option. A greyed out button is a choice that is
          sold out or does not exist with the other choices made. */}
      {groups.map((group) => (
        <div key={group.id} className="space-y-2" data-testid={`option-${group.title}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            {group.title}
            <span className="ml-2 font-medium normal-case tracking-normal text-zinc-500">
              {selection[group.id]}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const state = valueState(product, groups, selection, group.id, value);
              const isSelected = selection[group.id] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={state === "gone"}
                  title={state === "available" ? undefined : "Not available with your other choices"}
                  onClick={() => {
                    setSelection(choose(product, groups, selection, group.id, value));
                    setQuantity(1);
                  }}
                  className={`min-w-11 px-4 py-2 border rounded-md text-sm transition ${
                    isSelected
                      ? "border-black bg-zinc-900 text-white font-semibold"
                      : state === "gone"
                      ? "border-zinc-200 bg-zinc-100 text-zinc-300 line-through cursor-not-allowed"
                      : state === "unavailable"
                      ? "border-zinc-200 bg-white text-zinc-400 line-through hover:border-zinc-400"
                      : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Plain list of variants, for variants that have no options to choose from */}
      {groups.length === 0 && variants.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Select Variant
          </label>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((v: ProductVariant) => {
              const isSelected = v.id === selectedVariantId;
              const vStock = v.inventory_quantity;
              const vOutOfStock = vStock !== undefined && vStock <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQuantity(1);
                  }}
                  disabled={vOutOfStock}
                  className={`p-3 text-left border rounded-lg transition text-xs flex flex-col justify-between ${
                    isSelected
                      ? "border-black bg-zinc-50 font-semibold text-black ring-1 ring-black"
                      : vOutOfStock
                      ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "border-zinc-200 hover:border-zinc-400 text-zinc-800"
                  }`}
                >
                  <span className="font-medium">{v.title}</span>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {vOutOfStock
                      ? "Out of stock"
                      : vStock !== undefined
                      ? `${vStock} left`
                      : "Available"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector & Add to Cart Button */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-zinc-300 rounded-md bg-white">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="px-3 py-2 text-zinc-600 hover:text-black disabled:opacity-30 transition font-bold"
            >
              -
            </button>
            <span className="px-3 py-2 text-sm font-semibold min-w-10 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  inventory !== undefined
                    ? Math.min(inventory, quantity + 1)
                    : quantity + 1
                )
              }
              disabled={
                isOutOfStock ||
                (inventory !== undefined && quantity >= inventory)
              }
              className="px-3 py-2 text-zinc-600 hover:text-black disabled:opacity-30 transition font-bold"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || cartLoading || isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white font-semibold py-3 px-6 rounded-md hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed transition text-sm shadow-sm"
          >
            <ShoppingBag size={18} />
            <span>
              {isAdding
                ? "Adding..."
                : isOutOfStock
                ? "Out of Stock"
                : "Add to Cart"}
            </span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
