import React from "react";
import { Banner } from "@/lib/medusa";
import { BannerContent } from "@/components/BannerContent";

interface PromoBannersProps {
  banners: Banner[];
}

// Up to 2 promo banners set by the merchant, side by side. Nothing shows when
// the merchant has not added any.
export function PromoBanners({ banners }: PromoBannersProps) {
  if (banners.length === 0) return null;

  const pair = banners.length > 1;

  return (
    <section
      aria-label="Promotions"
      className={`grid gap-4 sm:gap-6 ${pair ? "md:grid-cols-2" : ""}`}
    >
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`relative w-full overflow-hidden rounded-2xl bg-zinc-100 aspect-[16/9] sm:aspect-[8/3] ${
            pair ? "" : "lg:aspect-[16/5]"
          }`}
        >
          <BannerContent
            banner={banner}
            size="promo"
            sizes={pair ? "(max-width: 768px) 100vw, 600px" : "(max-width: 1280px) 100vw, 1216px"}
          />
        </div>
      ))}
    </section>
  );
}
