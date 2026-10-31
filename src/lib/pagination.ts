// Pagination rules for the Shop page. No React here, so they are easy to test.

export const PRODUCTS_PER_PAGE = 15;

export function pageCount(total: number, perPage: number = PRODUCTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

// The page asked for in the URL (?page=3). Anything that is not a whole number
// of 1 or more gives page 1, and a page past the end gives the last page, so a
// stale link never shows an empty list.
export function parsePage(value: string | null | undefined, totalPages: number): number {
  const n = Number(value);
  if (!value || !Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, totalPages));
}

// The slice of a list that belongs to a page
export function pageSlice<T>(
  items: T[],
  page: number,
  perPage: number = PRODUCTS_PER_PAGE
): T[] {
  return items.slice((page - 1) * perPage, page * perPage);
}

export type PageItem = number | "gap-start" | "gap-end";

// The buttons to show: always the first and last page, the current page and
// its neighbours, and a gap marker where pages are left out. A gap that would
// hide a single page shows that page instead.
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 1) return [1];

  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const items: PageItem[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const previous = pages[i - 1];
    if (previous !== undefined) {
      if (page - previous === 2) {
        items.push(previous + 1);
      } else if (page - previous > 2) {
        items.push(previous < current ? "gap-start" : "gap-end");
      }
    }
    items.push(page);
  }
  return items;
}
