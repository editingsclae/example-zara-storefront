import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductByHandle, STORE_NAME, cleanCategoryHandle } from "@/lib/medusa";
import { ProductDetailsClient } from "@/components/ProductDetailsClient";
import { ChevronRight, Package, ShieldCheck, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const primaryCategory = product.categories?.[0];
  const images = product.images && product.images.length > 0
    ? product.images
    : product.thumbnail
    ? [{ id: "thumb", url: product.thumbnail }]
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-black transition">
          {STORE_NAME}
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
        {/* Left: Product Images / Visual Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
            {images.length > 0 ? (
              <Image
                src={images[0].url}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 gap-3 p-8 text-center">
                <Package size={56} strokeWidth={1.5} />
                <span className="text-sm font-medium uppercase tracking-wider">
                  {product.title}
                </span>
                <span className="text-xs text-zinc-400">No image uploaded</span>
              </div>
            )}
          </div>

          {/* Multiple thumbnails if available */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative w-20 h-20 rounded-md overflow-hidden border border-zinc-200 shrink-0"
                >
                  <Image
                    src={img.url}
                    alt={product.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
                <p className="font-semibold text-zinc-900">Aramex / First Delivery</p>
                <p className="text-[11px] text-zinc-500">Tunisia nationwide</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <ShieldCheck size={18} className="text-zinc-700 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-900">Verified Merchant</p>
                <p className="text-[11px] text-zinc-500">Authentic {STORE_NAME} stock</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
