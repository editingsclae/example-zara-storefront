import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryByHandle,
  getAllProducts,
  getCategories,
  STORE_NAME,
} from "@/lib/medusa";
import { ShopClient } from "@/components/ShopClient";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);
  if (!category) {
    return {
      title: STORE_NAME,
    };
  }
  return {
    title: `${category.name} | ${STORE_NAME}`,
    description:
      category.description ||
      `Shop ${category.name} at ${STORE_NAME}. Cash on delivery.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { handle } = await params;
  const category = await getCategoryByHandle(handle);

  if (!category) {
    notFound();
  }

  // Fetch all products for this category using getAllProducts (no 50-limit truncation)
  const [products, categories] = await Promise.all([
    getAllProducts({ category_id: category.id }),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-black transition">
          {STORE_NAME}
        </Link>
        <ChevronRight size={14} />
        <Link href="/shop" className="hover:text-black transition">
          Shop
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
        </div>
        {category.description && (
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Client Shop Component with Category Fixed */}
      <Suspense
        fallback={
          <div className="py-20 text-center text-xs font-mono text-zinc-500">
            Loading products...
          </div>
        }
      >
        <ShopClient
          products={products}
          categories={categories}
          fixedCategory={category}
        />
      </Suspense>
    </div>
  );
}
