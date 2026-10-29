"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductGalleryProps {
  images: Array<{ id: string; url: string }>;
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = images[selectedIndex] || images[0];

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex flex-col items-center justify-center text-zinc-400 gap-3 p-8 text-center">
        <Package size={56} strokeWidth={1.5} />
        <span className="text-sm font-medium uppercase tracking-wider text-zinc-600">
          {title}
        </span>
        <span className="text-xs text-zinc-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Large Featured Image */}
      <div className="relative aspect-square w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
        <Image
          src={selectedImage.url}
          alt={`${title} - view ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-all duration-200"
        />
      </div>

      {/* Thumbnails row (keyboard accessible buttons) */}
      {images.length > 1 && (
        <div
          role="region"
          aria-label="Product thumbnails"
          className="flex gap-2.5 overflow-x-auto pb-2 pt-1"
        >
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIndex(idx);
                  }
                }}
                aria-label={`Select product image ${idx + 1} of ${images.length}`}
                aria-pressed={isSelected}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border transition shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                  isSelected
                    ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-1"
                    : "border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${title} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
