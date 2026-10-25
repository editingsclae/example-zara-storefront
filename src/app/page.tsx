import React from "react";
import Link from "next/link";
import { STORE_NAME, getProducts, getCategories, Product, MerchantCategory } from "@/lib/medusa";
import { ProductCard } from "@/components/ProductCard";
import { PackageX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let products: Product[] = [];
  let categories: MerchantCategory[] = [];
  let error: string | null = null;

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
  } catch (err: unknown) {
    console.error("Error loading home catalog:", err);
    error = err instanceof Error ? err.message : "Failed to load products from store.";
  }

  return (
    <div className="space-y-8">
      {/* Store Hero Banner */}
      <div className="border border-zinc-200 rounded-xl p-8 bg-gradient-to-r from-zinc-50 to-zinc-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-zinc-900 text-white">
            Official Storefront
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 uppercase">
            {STORE_NAME}
          </h1>
          <p className="text-sm text-zinc-600 max-w-xl">
            Browse authentic products from {STORE_NAME}. Fast regional delivery across Tunisia.
          </p>
        </div>

        {/* Quick Category Badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cat.handle}`}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 hover:border-black hover:text-black transition"
              >
                {cat.name} ({cat.product_count})
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Section */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            All Products
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <p className="font-semibold mb-1">Unable to connect to store catalog</p>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && products.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl space-y-3">
            <PackageX size={44} className="mx-auto text-zinc-400" />
            <h3 className="text-base font-semibold text-zinc-800">No products available</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              There are currently no published products for {STORE_NAME}. Please check back later.
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
