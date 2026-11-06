// Tells the backend how many promo banners this storefront has room for, so the
// merchant's portal shows exactly that many places. Runs when the server starts
// (see src/instrumentation.ts). Saying the same thing again changes nothing.

// The number of promo banner places on this storefront's home page.
// Change it here when the home page gets more or fewer places for them.
export const LAYOUT = { promo_banners: 2 };

type Env = Record<string, string | undefined>;

export type DeclareResult = "skipped" | "declared" | "failed";

export async function declareLayout(
  env: Env = process.env,
  fetchFn: typeof fetch = fetch
): Promise<DeclareResult> {
  const layoutKey = env.STOREFRONT_LAYOUT_KEY;
  const publishableKey = env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const backend = env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.getcardy.shop";

  // Without a layout key nothing is sent and the merchant keeps the default
  // number of places. The key is created in the portal (Appearance, Promo banners).
  if (!layoutKey || !publishableKey) {
    console.info("[layout] STOREFRONT_LAYOUT_KEY is not set: the number of promo banners is not declared.");
    return "skipped";
  }

  try {
    const response = await fetchFn(`${backend.replace(/\/+$/, "")}/store/merchant/storefront/layout`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
        "x-layout-key": layoutKey,
      },
      body: JSON.stringify(LAYOUT),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[layout] The backend refused the layout (${response.status}). Check STOREFRONT_LAYOUT_KEY.`);
      return "failed";
    }
    console.info(`[layout] Declared ${LAYOUT.promo_banners} promo banner places.`);
    return "declared";
  } catch (error) {
    // Never stop the storefront from starting because of this
    console.error("[layout] Could not declare the layout:", error);
    return "failed";
  }
}
