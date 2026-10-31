import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageItems } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const buttonBase =
  "inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-lg border text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1";

// Previous / numbered pages / Next. Nothing shows when everything fits on one
// page. On phones the numbers are replaced by "Page 2 of 5".
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = pageItems(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 pt-8 pb-4"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={isFirst}
        aria-label="Previous page"
        className={`${buttonBase} gap-1 border-zinc-200 bg-white text-zinc-800 hover:border-zinc-900 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:cursor-not-allowed`}
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span className="sm:hidden px-2 text-xs font-mono text-zinc-600">
        Page {page} of {totalPages}
      </span>

      <ul className="hidden sm:flex items-center gap-2">
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                onClick={() => onChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`${buttonBase} ${
                  item === page
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-900"
                }`}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-zinc-400">
              &hellip;
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={isLast}
        aria-label="Next page"
        className={`${buttonBase} gap-1 border-zinc-200 bg-white text-zinc-800 hover:border-zinc-900 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:cursor-not-allowed`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
