import React, { Suspense } from "react";
import { getAllProducts, getCategories, STORE_NAME } from "@/lib/medusa";
import { ShopClient } from "@/components/ShopClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Shop | ${STORE_NAME}`,
  description: `Browse all products at ${STORE_NAME}. Fast delivery across Tunisia. Cash on delivery.`,
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          Shop All Products
        </h1>
        <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
          Browse our entire catalog. Filter by category, price, options and more.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-20 text-center text-xs font-mono text-zinc-500">
            Loading catalog...
          </div>
        }
      >
        <ShopClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
