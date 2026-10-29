import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductByHandle,
  getProducts,
  STORE_NAME,
  cleanCategoryHandle,
  Product,
} from "@/lib/medusa";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductDetailsClient } from "@/components/ProductDetailsClient";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, ShieldCheck, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return {
      title: STORE_NAME,
    };
  }

  const rawDesc = product.description || `Shop ${product.title} at ${STORE_NAME}. Cash on delivery.`;
  const description = rawDesc.slice(0, 160);
  const ogImages = product.thumbnail ? [product.thumbnail] : [];

  return {
    title: `${product.title} | ${STORE_NAME}`,
    description,
    openGraph: {
      title: `${product.title} | ${STORE_NAME}`,
      description,
      images: ogImages,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const primaryCategory = product.categories?.[0];

  // Images for gallery
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.thumbnail
      ? [{ id: "thumb", url: product.thumbnail }]
      : [];

  // "You may also like" row: up to 4 other products of the first category
  let relatedProducts: Product[] = [];
  if (primaryCategory?.id) {
    try {
      const categoryProducts = await getProducts({
        category_id: primaryCategory.id,
        limit: 5,
      });
      relatedProducts = categoryProducts
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
    } catch (err) {
      console.error("Failed to fetch related products:", err);
    }
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-black transition">
          {STORE_NAME}
        </Link>
        <ChevronRight size={14} />
        <Link href="/shop" className="hover:text-black transition">
          Shop
        </Link>
        <ChevronRight size={14} />
        {primaryCategory && (
          <>
            <Link
              href={`/c/${cleanCategoryHandle(primaryCategory.handle)}`}
              className="hover:text-black transition"
            >
              {primaryCategory.name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-zinc-900 font-medium truncate max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Interactive Accessible Gallery */}
        <ProductGallery images={images} title={product.title} />

        {/* Right: Product Info & Actions */}
        <div className="space-y-6">
          <div className="border-b border-zinc-200 pb-5">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
              {STORE_NAME}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-sm text-zinc-500 mt-1">{product.subtitle}</p>
            )}
          </div>

          {/* Client Interactive Area (Variant picker, Price, Add to Cart) */}
          <ProductDetailsClient product={product} />

          {/* Product Description */}
          {product.description && (
            <div className="pt-6 border-t border-zinc-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2">
                Description
              </h2>
              <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <Truck size={18} className="text-zinc-700 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-900">Nationwide Delivery</p>
                <p className="text-[11px] text-zinc-500">Across Tunisia</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <ShieldCheck size={18} className="text-zinc-700 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-900">Cash on Delivery</p>
                <p className="text-[11px] text-zinc-500">Pay at your doorstep</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "You may also like" Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              You may also like
            </h2>
            {primaryCategory && (
              <Link
                href={`/c/${cleanCategoryHandle(primaryCategory.handle)}`}
                className="text-xs font-medium text-zinc-600 hover:text-black transition"
              >
                View all in {primaryCategory.name} &rarr;
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
