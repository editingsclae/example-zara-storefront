import React from "react";
import Link from "next/link";
import {
  FOOTER_NETWORK_NAMES,
  STORE_NAME,
  getFooterSettings,
} from "@/lib/medusa";

export async function Footer() {
  const footer = await getFooterSettings();
  const name = footer.store_name || STORE_NAME;
  const description = footer.description || "Cash on delivery across Tunisia.";

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="space-y-1 text-center sm:text-left">
            <p
              data-testid="footer-name"
              className="font-semibold text-zinc-800 tracking-wider uppercase"
            >
              {name}
            </p>
            <p data-testid="footer-description">{description}</p>
            {footer.social_links.length > 0 && (
              <ul
                data-testid="footer-social"
                className="flex items-center justify-center sm:justify-start gap-4 pt-1"
              >
                {footer.social_links.map((link) => (
                  <li key={link.network}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-network={link.network}
                      className="text-zinc-600 hover:text-zinc-900 transition font-medium"
                    >
                      {FOOTER_NETWORK_NAMES[link.network]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
            <span>&copy; {new Date().getFullYear()} {name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
