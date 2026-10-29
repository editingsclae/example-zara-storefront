import React from "react";
import Link from "next/link";
import {
  STORE_NAME,
  getProducts,
  getCategories,
  cleanCategoryHandle,
  Product,
  MerchantCategory,
} from "@/lib/medusa";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Sparkles, LayoutGrid, PackageX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let newArrivals: Product[] = [];
  let categories: MerchantCategory[] = [];
  let error: string | null = null;

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      getProducts({ limit: 8, order: "-created_at" }),
      getCategories(),
    ]);
    newArrivals = fetchedProducts;
    categories = fetchedCategories;
  } catch (err: unknown) {
    console.error("Error loading landing page data:", err);
    error =
      err instanceof Error ? err.message : "Failed to load products from store.";
  }

  return (
    <div className="space-y-12 pb-10">
      {/* Store Hero Banner */}
      <div className="border border-zinc-200 rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-zinc-50 via-zinc-100/50 to-zinc-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-zinc-900 text-white">
            <Sparkles size={12} />
            <span>Official Storefront</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 uppercase">
            {STORE_NAME}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Browse authentic products from {STORE_NAME}. Fast delivery across
            Tunisia with cash on delivery.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition shadow-sm"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Quick Category Badges in Hero */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 max-w-md">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cleanCategoryHandle(cat.handle)}`}
                className="text-xs font-medium px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-black transition shadow-2xs"
              >
                <span>{cat.name}</span>
                {cat.product_count > 0 && (
                  <span className="ml-1.5 text-zinc-400 font-mono text-[11px]">
                    {cat.product_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Category Tiles Section */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-zinc-700" />
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-medium text-zinc-600 hover:text-black transition"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cleanCategoryHandle(cat.handle)}`}
                className="group p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 group-hover:text-black transition">
                    {cat.name}
                  </h3>
                </div>
                <div className="mt-3 text-[11px] font-mono text-zinc-400">
                  {cat.product_count} {cat.product_count === 1 ? "item" : "items"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              New Arrivals
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fresh additions to {STORE_NAME}&apos;s catalog
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-zinc-700 hover:text-black transition flex items-center gap-1"
          >
            <span>See all products</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <p className="font-semibold mb-1">Unable to load new arrivals</p>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && newArrivals.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl space-y-3">
            <PackageX size={44} className="mx-auto text-zinc-400" />
            <h3 className="text-base font-semibold text-zinc-800">
              No products available
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              There are currently no products listed for {STORE_NAME}.
            </p>
          </div>
        )}

        {/* 8 Newest Products Grid */}
        {!error && newArrivals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {/* Shop All Products CTA Button */}
        <div className="pt-6 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition shadow-sm"
          >
            <span>Shop all products</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
