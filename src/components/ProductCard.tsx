"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice } from "@/lib/medusa";
import { useCart } from "@/context/CartContext";
import { Package, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const variants = product.variants || [];
  const primaryVariant = variants[0];
  const price = primaryVariant?.calculated_price;

  // Calculate stock across variants
  let hasUnmanagedStock = false;
  let totalStock = 0;
  for (const v of variants) {
    if (v.inventory_quantity === undefined || v.inventory_quantity === null) {
      hasUnmanagedStock = true;
    } else {
      totalStock += v.inventory_quantity;
    }
  }

  // Stock badge rules:
  // "Out of stock" when 0, "Only N left" when 1 to 5, nothing otherwise.
  let stockBadge: React.ReactNode = null;
  if (!hasUnmanagedStock) {
    if (totalStock === 0) {
      stockBadge = (
        <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200">
          Out of stock
        </span>
      );
    } else if (totalStock >= 1 && totalStock <= 5) {
      stockBadge = (
        <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
          Only {totalStock} left
        </span>
      );
    }
  }

  // Determine button state:
  // "If the product has exactly one variant and it is in stock, the button reads "Add to cart" and adds it (the drawer opens). Otherwise it reads "Choose options" and links to the product page."
  const hasSingleVariant = variants.length === 1;
  const singleVariant = variants[0];
  const isSingleVariantInStock =
    hasSingleVariant &&
    (singleVariant.inventory_quantity === undefined ||
      singleVariant.inventory_quantity === null ||
      singleVariant.inventory_quantity > 0);

  const canQuickAdd = hasSingleVariant && isSingleVariantInStock;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canQuickAdd || !singleVariant || isAdding) return;
    try {
      setIsAdding(true);
      await addToCart(singleVariant.id, 1);
    } catch (err) {
      console.error("Failed to quick add to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const imageUrl = product.thumbnail || product.images?.[0]?.url;

  return (
    <div className="group border border-zinc-200 rounded-lg overflow-hidden bg-white hover:border-zinc-300 hover:shadow-sm transition flex flex-col justify-between">
      <div>
        {/* Product Image Link */}
        <Link
          href={`/p/${product.handle}`}
          className="block relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center h-full">
              <Package size={36} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider font-medium">
                {product.title}
              </span>
            </div>
          )}

          {/* Stock Badge */}
          {stockBadge && (
            <div className="absolute top-2 right-2">{stockBadge}</div>
          )}
        </Link>

        {/* Content Details */}
        <div className="p-4 space-y-2">
          {/* Title Link */}
          <Link
            href={`/p/${product.handle}`}
            className="block font-medium text-sm text-zinc-900 hover:text-black transition line-clamp-1"
          >
            {product.title}
          </Link>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-zinc-500 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="pt-1 text-sm font-semibold text-zinc-900">
            {price ? (
              formatPrice(price.calculated_amount, price.currency_code)
            ) : (
              <span className="text-zinc-400 text-xs">Price on request</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button Below (Non-nested) */}
      <div className="px-4 pb-4 pt-1 border-t border-zinc-100">
        {canQuickAdd ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isAdding ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ShoppingBag size={13} />
            )}
            <span>Add to cart</span>
          </button>
        ) : (
          <Link
            href={`/p/${product.handle}`}
            className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 text-center"
          >
            <span>Choose options</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
