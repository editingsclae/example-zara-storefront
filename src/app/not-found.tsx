import React from "react";
import Link from "next/link";
import { STORE_NAME } from "@/lib/medusa";
import { PackageX, ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-5">
      <PackageX size={56} className="mx-auto text-zinc-400" />
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          404 Error &bull; {STORE_NAME}
        </span>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          Page not found
        </h1>
        <p className="text-xs text-zinc-500">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
        >
          <ArrowLeft size={13} />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition shadow-sm"
        >
          <ShoppingBag size={13} />
          <span>Browse Shop</span>
        </Link>
      </div>
    </div>
  );
}
