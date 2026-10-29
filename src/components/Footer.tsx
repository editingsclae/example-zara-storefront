import React from "react";
import Link from "next/link";
import { STORE_NAME } from "@/lib/medusa";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-semibold text-zinc-800 tracking-wider uppercase">
              {STORE_NAME}
            </p>
            <p>Cash on delivery across Tunisia.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/shop"
              className="text-zinc-600 hover:text-zinc-900 transition font-medium"
            >
              Shop
            </Link>
            <Link
              href="/account"
              className="text-zinc-600 hover:text-zinc-900 transition font-medium"
            >
              Account
            </Link>
            <span>&copy; {new Date().getFullYear()} {STORE_NAME}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
