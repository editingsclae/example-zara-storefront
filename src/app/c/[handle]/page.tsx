import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryByHandle, getProducts, STORE_NAME, Product } from "@/lib/medusa";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, PackageX } from "lucide-react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);

  if (!category) {
    notFound();
  }

  // Fetch products filtered by the category's ID
  let products: Product[] = [];
  let error: string | null = null;
  try {
    products = await getProducts({ category_id: category.id });
  } catch (err: unknown) {
    console.error(`Error loading products for category ${category.name}:`, err);
    error = err instanceof Error ? err.message : "Failed to load products for this category.";
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-black transition">
          {STORE_NAME}
        </Link>
        <ChevronRight size={14} />
        <span className="text-zinc-900 font-medium">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            {category.name}
          </h1>
          <span className="text-xs font-mono text-zinc-500">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>
        {category.description && (
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <p className="font-semibold">Unable to fetch products</p>
          <p className="text-xs text-rose-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && products.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl space-y-3">
          <PackageX size={44} className="mx-auto text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-800">
            No products found in {category.name}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            This merchant currently has no products listed under this category.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block text-xs font-semibold px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition"
            >
              Back to All Products
            </Link>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
