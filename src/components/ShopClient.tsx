"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  Product,
  MerchantCategory,
  cleanCategoryHandle,
  formatPrice,
} from "@/lib/medusa";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import {
  PRODUCTS_PER_PAGE,
  pageCount,
  pageSlice,
  parsePage,
} from "@/lib/pagination";
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  PackageX,
  Check,
} from "lucide-react";

interface ShopClientProps {
  products: Product[];
  categories: MerchantCategory[];
  fixedCategory?: MerchantCategory;
}

interface CatalogOption {
  title: string;
  paramName: string;
  values: string[];
}

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getProductLowestPrice(product: Product): number | null {
  let lowest: number | null = null;
  for (const v of product.variants || []) {
    const amount = v.calculated_price?.calculated_amount;
    if (typeof amount === "number" && !isNaN(amount)) {
      if (lowest === null || amount < lowest) {
        lowest = amount;
      }
    }
  }
  return lowest;
}

export function ShopClient({
  products,
  categories,
  fixedCategory,
}: ShopClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mobile sheet open state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Top of the results: where the page scrolls to when the page changes
  const resultsRef = useRef<HTMLDivElement>(null);

  // Local state for debounced inputs
  const urlQ = searchParams.get("q") || "";
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [searchInput, setSearchInput] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setSearchInput(urlQ);
  }

  const urlMin = searchParams.get("min") || "";
  const [prevUrlMin, setPrevUrlMin] = useState(urlMin);
  const [minInput, setMinInput] = useState(urlMin);
  if (urlMin !== prevUrlMin) {
    setPrevUrlMin(urlMin);
    setMinInput(urlMin);
  }

  const urlMax = searchParams.get("max") || "";
  const [prevUrlMax, setPrevUrlMax] = useState(urlMax);
  const [maxInput, setMaxInput] = useState(urlMax);
  if (urlMax !== prevUrlMax) {
    setPrevUrlMax(urlMax);
    setMaxInput(urlMax);
  }

  // URL state update helper
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      // Any filter, search or sort change starts again from page 1. Only a
      // call that sets the page itself keeps it.
      if (!("page" in newParams)) {
        current.delete("page");
      }
      for (const [key, val] of Object.entries(newParams)) {
        if (val === null || val === undefined || val === "") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      }
      const qs = current.toString();
      // history.replaceState keeps useSearchParams in sync (Next.js 14.1+) but
      // does not re-render the server page. router.replace would refetch the
      // whole catalog from the backend on every keystroke or click.
      window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
    },
    [searchParams, pathname]
  );

  // Debounced search input handler (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      const trimmed = searchInput.trim();
      if (trimmed !== currentQ) {
        updateParams({ q: trimmed || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);

  // Debounced price min/max handler (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMin = searchParams.get("min") || "";
      const trimmedMin = minInput.trim();
      if (trimmedMin !== currentMin) {
        updateParams({ min: trimmedMin || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [minInput, searchParams, updateParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMax = searchParams.get("max") || "";
      const trimmedMax = maxInput.trim();
      if (trimmedMax !== currentMax) {
        updateParams({ max: trimmedMax || null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [maxInput, searchParams, updateParams]);

  // Catalog min & max price
  const { catalogMinPrice, catalogMaxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of products) {
      const price = getProductLowestPrice(p);
      if (price !== null) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    }
    return {
      catalogMinPrice: min === Infinity ? 0 : Math.floor(min),
      catalogMaxPrice: max === -Infinity ? 0 : Math.ceil(max),
    };
  }, [products]);

  // Category product counts from loaded products
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      for (const c of p.categories || []) {
        const clean = cleanCategoryHandle(c.handle).toLowerCase();
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    }
    return counts;
  }, [products]);

  // Visible categories (product_count > 0)
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      const clean = cleanCategoryHandle(cat.handle).toLowerCase();
      return (categoryCounts.get(clean) || 0) > 0;
    });
  }, [categories, categoryCounts]);

  // Build catalog options with >= 2 distinct values across catalog
  const catalogOptions = useMemo<CatalogOption[]>(() => {
    const optionMap = new Map<
      string,
      { canonicalTitle: string; values: Set<string> }
    >();

    for (const product of products) {
      const optIdToKey = new Map<string, string>();
      for (const opt of product.options || []) {
        if (!opt.title) continue;
        const key = opt.title.trim().toLowerCase();
        optIdToKey.set(opt.id, key);
        let entry = optionMap.get(key);
        if (!entry) {
          entry = { canonicalTitle: opt.title.trim(), values: new Set() };
          optionMap.set(key, entry);
        }
        for (const val of opt.values || []) {
          if (val.value && val.value.trim()) {
            entry.values.add(val.value.trim());
          }
        }
      }
      for (const variant of product.variants || []) {
        for (const vo of variant.options || []) {
          const key = optIdToKey.get(vo.option_id);
          if (key && vo.value && vo.value.trim()) {
            optionMap.get(key)?.values.add(vo.value.trim());
          }
        }
      }
    }

    const options: CatalogOption[] = [];
    for (const [, entry] of optionMap.entries()) {
      if (entry.values.size >= 2) {
        options.push({
          title: entry.canonicalTitle,
          paramName: `opt_${entry.canonicalTitle}`,
          values: Array.from(entry.values).sort(),
        });
      }
    }
    return options.sort((a, b) => a.title.localeCompare(b.title));
  }, [products]);

  // Parse active filters from URL
  const activeQ = searchParams.get("q") || "";

  const activeCategoryHandles = useMemo(() => {
    const raw = searchParams.get("category");
    if (!raw) return [];
    return raw
      .split(",")
      .map((h) => cleanCategoryHandle(h.trim()).toLowerCase())
      .filter(Boolean);
  }, [searchParams]);

  const activeMinPrice = useMemo(() => {
    const raw = searchParams.get("min");
    if (!raw) return null;
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  }, [searchParams]);

  const activeMaxPrice = useMemo(() => {
    const raw = searchParams.get("max");
    if (!raw) return null;
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  }, [searchParams]);

  const activeInStock = searchParams.get("stock") === "1";
  const activeSort = searchParams.get("sort") || "newest";

  // Parse option filters from URL
  const activeOptionFilters = useMemo(() => {
    const filters = new Map<string, string[]>(); // canonicalTitle -> values[]
    for (const opt of catalogOptions) {
      const raw = searchParams.get(opt.paramName);
      if (raw) {
        const vals = raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        if (vals.length > 0) {
          filters.set(opt.title, vals);
        }
      }
    }
    return filters;
  }, [searchParams, catalogOptions]);

  // Filtering + Sorting in browser
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search (q)
      if (activeQ) {
        const normQ = normalizeText(activeQ);
        const matchesTitle = normalizeText(product.title).includes(normQ);
        const matchesSub = normalizeText(product.subtitle).includes(normQ);
        const matchesDesc = normalizeText(product.description).includes(normQ);
        if (!matchesTitle && !matchesSub && !matchesDesc) {
          return false;
        }
      }

      // 2. Categories (multi-select)
      if (!fixedCategory && activeCategoryHandles.length > 0) {
        const productCatHandles = (product.categories || []).map((c) =>
          cleanCategoryHandle(c.handle).toLowerCase()
        );
        const matchesCat = activeCategoryHandles.some((h) =>
          productCatHandles.includes(h)
        );
        if (!matchesCat) return false;
      }

      // 3. Price
      const lowestPrice = getProductLowestPrice(product);
      const isPriceFilterActive =
        activeMinPrice !== null || activeMaxPrice !== null;
      if (isPriceFilterActive) {
        if (lowestPrice === null) return false;
        if (activeMinPrice !== null && lowestPrice < activeMinPrice) return false;
        if (activeMaxPrice !== null && lowestPrice > activeMaxPrice) return false;
      }

      // 4. In stock only
      if (activeInStock) {
        const hasStock = (product.variants || []).some(
          (v) =>
            v.inventory_quantity === undefined ||
            v.inventory_quantity === null ||
            v.inventory_quantity > 0
        );
        if (!hasStock) return false;
      }

      // 5. Options
      if (activeOptionFilters.size > 0) {
        const optIdToTitle = new Map<string, string>();
        for (const opt of product.options || []) {
          optIdToTitle.set(opt.id, opt.title.trim().toLowerCase());
        }

        for (const [optTitle, selectedVals] of activeOptionFilters.entries()) {
          const targetTitleLower = optTitle.trim().toLowerCase();
          const targetValsLower = selectedVals.map((v) => v.toLowerCase());

          const variantMatches = (product.variants || []).some((v) => {
            return (v.options || []).some((vo) => {
              const voTitleLower = optIdToTitle.get(vo.option_id);
              if (voTitleLower === targetTitleLower) {
                return targetValsLower.includes((vo.value || "").trim().toLowerCase());
              }
              return false;
            });
          });

          if (!variantMatches) return false;
        }
      }

      return true;
    });
  }, [
    products,
    activeQ,
    fixedCategory,
    activeCategoryHandles,
    activeMinPrice,
    activeMaxPrice,
    activeInStock,
    activeOptionFilters,
  ]);

  // Sorted products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (activeSort === "price_asc") {
      list.sort((a, b) => {
        const priceA = getProductLowestPrice(a);
        const priceB = getProductLowestPrice(b);
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;
        return priceA - priceB;
      });
    } else if (activeSort === "price_desc") {
      list.sort((a, b) => {
        const priceA = getProductLowestPrice(a);
        const priceB = getProductLowestPrice(b);
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;
        return priceB - priceA;
      });
    } else if (activeSort === "name_asc") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // newest (created_at desc)
      list.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }
    return list;
  }, [filteredProducts, activeSort]);

  // Pagination: 15 products per page, the page lives in the URL (?page=2) so a
  // product page's Back button returns to the same page of the list.
  const totalPages = pageCount(sortedProducts.length);
  const currentPage = parsePage(searchParams.get("page"), totalPages);
  const pageProducts = useMemo(
    () => pageSlice(sortedProducts, currentPage),
    [sortedProducts, currentPage]
  );
  const firstShown = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastShown = firstShown + pageProducts.length - 1;

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), totalPages);
      updateParams({ page: next === 1 ? null : String(next) });
      // Show the top of the new page's products, not the bottom of the old page
      requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        resultsRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    },
    [totalPages, updateParams]
  );

  // Handlers for toggles
  const handleToggleCategory = useCallback(
    (handle: string) => {
      const clean = cleanCategoryHandle(handle).toLowerCase();
      let next: string[];
      if (activeCategoryHandles.includes(clean)) {
        next = activeCategoryHandles.filter((h) => h !== clean);
      } else {
        next = [...activeCategoryHandles, clean];
      }
      updateParams({ category: next.length > 0 ? next.join(",") : null });
    },
    [activeCategoryHandles, updateParams]
  );

  const handleToggleOptionValue = useCallback(
    (optTitle: string, paramName: string, val: string) => {
      const currentVals = activeOptionFilters.get(optTitle) || [];
      let next: string[];
      if (currentVals.includes(val)) {
        next = currentVals.filter((v) => v !== val);
      } else {
        next = [...currentVals, val];
      }
      updateParams({ [paramName]: next.length > 0 ? next.join(",") : null });
    },
    [activeOptionFilters, updateParams]
  );

  const handleClearAllFilters = () => {
    window.history.replaceState(null, "", pathname);
  };

  // Lock scroll on mobile bottom sheet open & escape key
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsMobileFiltersOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isMobileFiltersOpen]);

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (activeQ) {
      chips.push({
        id: "q",
        label: `"${activeQ}"`,
        onRemove: () => updateParams({ q: null }),
      });
    }

    if (!fixedCategory) {
      for (const h of activeCategoryHandles) {
        const cat = categories.find(
          (c) => cleanCategoryHandle(c.handle).toLowerCase() === h
        );
        chips.push({
          id: `cat_${h}`,
          label: cat ? cat.name : h,
          onRemove: () => handleToggleCategory(h),
        });
      }
    }

    if (activeMinPrice !== null) {
      chips.push({
        id: "min",
        label: `Min: ${formatPrice(activeMinPrice)}`,
        onRemove: () => updateParams({ min: null }),
      });
    }

    if (activeMaxPrice !== null) {
      chips.push({
        id: "max",
        label: `Max: ${formatPrice(activeMaxPrice)}`,
        onRemove: () => updateParams({ max: null }),
      });
    }

    if (activeInStock) {
      chips.push({
        id: "stock",
        label: "In stock only",
        onRemove: () => updateParams({ stock: null }),
      });
    }

    for (const [title, vals] of activeOptionFilters.entries()) {
      const opt = catalogOptions.find((o) => o.title === title);
      const paramName = opt ? opt.paramName : `opt_${title}`;
      for (const val of vals) {
        chips.push({
          id: `opt_${title}_${val}`,
          label: `${title}: ${val}`,
          onRemove: () => handleToggleOptionValue(title, paramName, val),
        });
      }
    }

    return chips;
  }, [
    activeQ,
    fixedCategory,
    activeCategoryHandles,
    categories,
    activeMinPrice,
    activeMaxPrice,
    activeInStock,
    activeOptionFilters,
    catalogOptions,
    updateParams,
    handleToggleCategory,
    handleToggleOptionValue,
  ]);

  const hasActiveFilters = activeChips.length > 0;

  // Filter Sidebar / Sheet Content
  const renderFilterControls = (isMobileSheet = false) => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-7 py-2 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                updateParams({ q: null });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Categories (hidden on fixedCategory) */}
      {!fixedCategory && visibleCategories.length > 0 && (
        <div className="border-t border-zinc-200 pt-5">
          <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
            Categories
          </label>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {visibleCategories.map((cat) => {
              const clean = cleanCategoryHandle(cat.handle).toLowerCase();
              const isChecked = activeCategoryHandles.includes(clean);
              const count = categoryCounts.get(clean) || 0;
              return (
                <label
                  key={cat.id}
                  className="flex items-center justify-between text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat.handle)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="border-t border-zinc-200 pt-5">
        <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
          Price Range
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              step="any"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder={`${catalogMinPrice}`}
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              aria-label="Minimum price"
            />
          </div>
          <span className="text-zinc-400 text-xs">-</span>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              step="any"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder={`${catalogMaxPrice}`}
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* In Stock Only */}
      <div className="border-t border-zinc-200 pt-5">
        <label className="flex items-center justify-between text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none">
          <span className="font-semibold uppercase tracking-wider text-zinc-900">
            In stock only
          </span>
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={(e) =>
              updateParams({ stock: e.target.checked ? "1" : null })
            }
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4 cursor-pointer"
          />
        </label>
      </div>

      {/* Dynamic Product Options */}
      {catalogOptions.map((opt) => {
        const activeVals = activeOptionFilters.get(opt.title) || [];
        return (
          <div key={opt.title} className="border-t border-zinc-200 pt-5">
            <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2.5">
              {opt.title}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {opt.values.map((val) => {
                const isChecked = activeVals.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-900 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        handleToggleOptionValue(opt.title, opt.paramName, val)
                      }
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Clear All inside mobile sheet */}
      {isMobileSheet && hasActiveFilters && (
        <div className="border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
          >
            <RotateCcw size={13} />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mobile Top Bar: Filters Trigger + Sort */}
      <div className="lg:hidden flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeChips.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
              {activeChips.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <label htmlFor="mobile-sort" className="text-xs text-zinc-500">
            Sort:
          </label>
          <select
            id="mobile-sort"
            value={activeSort}
            onChange={(e) =>
              updateParams({
                sort: e.target.value === "newest" ? null : e.target.value,
              })
            }
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-xl border border-zinc-200 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <span className="text-sm font-bold text-zinc-900">Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
              >
                <RotateCcw size={12} />
                <span>Clear all</span>
              </button>
            )}
          </div>
          {renderFilterControls(false)}
        </aside>

        {/* Main Products Grid Area */}
        <div ref={resultsRef} className="lg:col-span-3 space-y-4 scroll-mt-28">
          {/* Desktop Top Header Bar: Counts, Chips, Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-600">
                {totalPages > 1
                  ? `${firstShown}\u2013${lastShown} of ${sortedProducts.length} products`
                  : `${sortedProducts.length} ${
                      sortedProducts.length === 1 ? "product" : "products"
                    }`}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="hidden sm:inline-flex text-xs text-zinc-500 hover:text-zinc-900 items-center gap-1 transition"
                >
                  <RotateCcw size={12} />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <label htmlFor="desktop-sort" className="text-xs text-zinc-500">
                Sort:
              </label>
              <select
                id="desktop-sort"
                value={activeSort}
                onChange={(e) =>
                  updateParams({
                    sort: e.target.value === "newest" ? null : e.target.value,
                  })
                }
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="text-zinc-400 hover:text-zinc-700 transition"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl space-y-3 bg-zinc-50/50">
              <PackageX size={44} className="mx-auto text-zinc-400" />
              <h3 className="text-base font-semibold text-zinc-900">
                No products found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No items match your active filters. Try loosening your criteria or search term.
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition"
                  >
                    <RotateCcw size={13} />
                    <span>Clear filters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Grid */}
          {sortedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pageProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters Modal */}
      {isMobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
              <span className="text-sm font-bold text-zinc-900">Filters</span>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md transition"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {renderFilterControls(true)}
            </div>

            {/* Bottom Apply Action Button */}
            <div className="p-4 border-t border-zinc-200 bg-white">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>Apply ({sortedProducts.length} results)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
