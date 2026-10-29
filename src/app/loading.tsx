import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="border border-zinc-200 rounded-xl p-8 bg-zinc-100/70 h-40 flex flex-col justify-center space-y-3">
        <div className="h-5 bg-zinc-200 rounded-full w-28" />
        <div className="h-8 bg-zinc-200 rounded-md w-64" />
        <div className="h-4 bg-zinc-200 rounded w-96 max-w-full" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-white"
          >
            <div className="aspect-[4/3] bg-zinc-100 rounded-md w-full" />
            <div className="space-y-1.5 pt-1">
              <div className="h-4 bg-zinc-200/70 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div className="h-4 bg-zinc-200/70 rounded w-16" />
              <div className="h-8 bg-zinc-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
