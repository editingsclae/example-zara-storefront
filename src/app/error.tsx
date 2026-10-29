"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-5">
      <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
        <AlertCircle size={28} />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-xs text-zinc-500">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-zinc-400">
            Error digest: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition shadow-sm cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Try again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
        >
          <Home size={13} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
