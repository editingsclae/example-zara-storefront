"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MerchantCategory, STORE_NAME } from "@/lib/medusa";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, User, Menu, X, ChevronRight, Search } from "lucide-react";

interface HeaderProps {
  categories: MerchantCategory[];
}

export function Header({ categories }: HeaderProps) {
  const { itemCount, openCart } = useCart();
  const { customer } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");

  const isCartOrCheckout = pathname === "/cart" || pathname === "/checkout";

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = desktopSearch.trim();
    if (query) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setDesktopSearch("");
    } else {
      router.push("/shop");
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = mobileSearch.trim();
    setMobileMenuOpen(false);
    if (query) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setMobileSearch("");
    } else {
      router.push("/shop");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Left: Mobile Menu Toggle & Store Logo */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="font-bold tracking-widest text-lg sm:text-xl uppercase text-zinc-900 hover:opacity-80 transition"
            >
              {STORE_NAME}
            </Link>
          </div>

          {/* Center: Navigation (Desktop) with Shop link first */}
          <nav className="hidden md:flex items-center gap-5 flex-shrink-0">
            <Link
              href="/shop"
              className="text-sm font-semibold text-zinc-900 hover:text-black transition"
            >
              Shop
            </Link>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/c/${cat.handle}`}
                  className="text-sm font-medium text-zinc-600 hover:text-black transition flex items-center gap-1.5"
                >
                  <span>{cat.name}</span>
                  {cat.product_count > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-mono">
                      {cat.product_count}
                    </span>
                  )}
                </Link>
              ))
            ) : null}
          </nav>

          {/* Desktop Search Box */}
          <form
            onSubmit={handleDesktopSearch}
            className="hidden md:flex items-center relative w-40 lg:w-56 flex-shrink"
          >
            <input
              type="text"
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
            />
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
          </form>

          {/* Right: Customer & Cart Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/account"
              className="flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm"
              title={customer ? `Logged in as ${customer.email}` : "Sign In"}
            >
              <User size={19} />
              <span className="hidden sm:inline font-medium">
                {customer ? customer.first_name || "Account" : "Sign In"}
              </span>
            </Link>

            {isCartOrCheckout ? (
              <Link
                href="/cart"
                id="header-cart-button"
                className="relative flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm"
                title="View Cart"
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                id="header-cart-button"
                onClick={openCart}
                className="relative flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm cursor-pointer"
                title="Open Cart"
                aria-label={`Open Cart with ${itemCount} items`}
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Search Box at top of menu */}
          <form onSubmit={handleMobileSearch} className="relative mb-3">
            <input
              type="text"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
          </form>

          {/* Shop Link First */}
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 text-sm font-semibold text-zinc-900 hover:text-black border-b border-zinc-100"
          >
            <span>Shop</span>
            <ChevronRight size={16} className="text-zinc-400" />
          </Link>

          {categories.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider my-2">
                Categories
              </div>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/c/${cat.handle}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-medium text-zinc-800 hover:text-black border-b border-zinc-100"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {cat.product_count}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="pt-3">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-zinc-800"
            >
              <User size={16} />
              <span>
                {customer
                  ? `My Account (${customer.email})`
                  : "Customer Sign In / Register"}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
