import React from "react";
import { STORE_NAME } from "@/lib/medusa";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            <p className="font-semibold text-zinc-800 tracking-wider uppercase mb-1">
              {STORE_NAME} Storefront
            </p>
            <p>
              Autonomous merchant storefront powered by Medusa v2. Scoped to {STORE_NAME}&apos;s sales channel.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span>Region: Tunisie (TND)</span>
            <span>&bull;</span>
            <span>Payment: System Default</span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} {STORE_NAME}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
