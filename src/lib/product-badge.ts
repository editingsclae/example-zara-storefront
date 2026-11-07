// The badge on a product card ("New", "Bestseller", "Sale"...). The merchant sets it
// per product in the portal and it arrives in the product's metadata. Never decide
// a badge in the storefront: draw this one, or nothing when it is empty.

export const MAX_BADGE_LENGTH = 16;

export function productBadge(
  product: { metadata?: Record<string, unknown> | null } | null | undefined
): string {
  const value = product?.metadata?.badge;
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  // Longer than the backend allows means damaged data: show nothing
  return text.length > 0 && text.length <= MAX_BADGE_LENGTH ? text : "";
}
