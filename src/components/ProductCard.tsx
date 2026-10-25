import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice } from "@/lib/medusa";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryVariant = product.variants?.[0];
  const price = primaryVariant?.calculated_price;
  const inventory = primaryVariant?.inventory_quantity;
  const inStock = inventory !== undefined ? inventory > 0 : true;

  const imageUrl = product.thumbnail || product.images?.[0]?.url;

  return (
    <Link
      href={`/p/${product.handle}`}
      className="group block border border-zinc-200 rounded-lg overflow-hidden bg-white hover:border-zinc-400 hover:shadow-sm transition flex flex-col"
    >
      {/* Product Image or Minimal Placeholder */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
            <Package size={36} strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wider font-medium">
              {product.title}
            </span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          {inStock ? (
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
              {inventory !== undefined ? `${inventory} in stock` : "In stock"}
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200">
              Out of stock
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-medium text-sm text-zinc-900 group-hover:text-black line-clamp-1">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">
            {price ? (
              formatPrice(price.calculated_amount, price.currency_code)
            ) : (
              <span className="text-zinc-400 text-xs">Price on request</span>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-500 group-hover:text-black transition">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
