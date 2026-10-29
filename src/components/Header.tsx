"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MerchantCategory, STORE_NAME } from "@/lib/medusa";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, User, Menu, X, ChevronRight } from "lucide-react";

interface HeaderProps {
  categories: MerchantCategory[];
}

export function Header({ categories }: HeaderProps) {
  const { itemCount, openCart } = useCart();
  const { customer } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCartOrCheckout = pathname === "/cart" || pathname === "/checkout";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu Toggle & Store Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="font-bold tracking-widest text-xl uppercase text-zinc-900 hover:opacity-80 transition"
            >
              {STORE_NAME}
            </Link>
          </div>

          {/* Center: Category Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-black transition"
            >
              All Products
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
            ) : (
              <span className="text-xs text-zinc-400 italic">No categories</span>
            )}
          </nav>

          {/* Right: Customer & Cart Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="flex items-center gap-2 p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition text-sm"
              title={customer ? `Logged in as ${customer.email}` : "Sign In"}
            >
              <User size={19} />
              <span className="hidden sm:inline font-medium">
                {customer ? (customer.first_name || "Account") : "Sign In"}
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
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Categories
          </div>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 text-sm font-medium text-zinc-800 hover:text-black border-b border-zinc-100"
          >
            <span>All Products</span>
            <ChevronRight size={16} className="text-zinc-400" />
          </Link>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cat.handle}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-sm font-medium text-zinc-800 hover:text-black border-b border-zinc-100"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-zinc-400">{cat.product_count}</span>
              </Link>
            ))
          ) : (
            <div className="text-xs text-zinc-400 italic py-2">
              No categories available
            </div>
          )}

          <div className="pt-3">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-zinc-800"
            >
              <User size={16} />
              <span>{customer ? `My Account (${customer.email})` : "Customer Sign In / Register"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
