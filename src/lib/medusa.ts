// Single centralized Medusa v2 API client for the storefront
// Swapping the merchant or backend URL touches ONLY environment variables.

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.getcardy.shop";
export const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME || "Store";

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: Array<{
    iso_2: string;
    iso_3: string;
    name: string;
    display_name: string;
  }>;
}

export interface MerchantCategory {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  rank: number;
  product_count: number;
}

export interface ProductCalculatedPrice {
  calculated_amount: number;
  original_amount: number;
  currency_code: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  inventory_quantity?: number;
  calculated_price?: ProductCalculatedPrice | null;
  options?: Array<{
    id: string;
    value: string;
    option_id: string;
  }>;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  handle: string;
  thumbnail?: string | null;
  images?: Array<{ id: string; url: string }>;
  variants: ProductVariant[];
  categories?: Array<{ id: string; name: string; handle: string }>;
  options?: Array<{
    id: string;
    title: string;
    values: Array<{ id: string; value: string }>;
  }>;
  created_at?: string;
}

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  thumbnail?: string | null;
  variant_id: string;
  product_id: string;
  product_title?: string;
  variant_title?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  country_code: string;
  postal_code: string;
  phone?: string;
  company?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price_type: string;
  amount: number;
  calculated_price?: {
    calculated_amount: number;
    currency_code: string;
  };
}

export interface Cart {
  id: string;
  currency_code: string;
  email: string | null;
  region_id: string;
  total: number;
  subtotal: number;
  item_subtotal?: number;
  shipping_subtotal?: number;
  tax_total: number;
  shipping_total: number;
  customer_id?: string | null;
  sales_channel_id?: string;
  items: LineItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  shipping_methods?: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  region?: Region;
}

export interface Order {
  id: string;
  display_id?: number | string;
  status: string;
  fulfillment_status?: string;
  payment_status?: string;
  total: number;
  subtotal: number;
  item_subtotal?: number;
  shipping_subtotal?: number;
  tax_total: number;
  shipping_total: number;
  currency_code: string;
  created_at: string;
  email: string;
  items: LineItem[];
  shipping_address?: Address | null;
  shipping_methods?: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
}

export function getDerivedOrderStatus(order: { fulfillment_status?: string; status?: string }): string {
  const fStatus = (order.fulfillment_status || "").toLowerCase();
  if (fStatus === "delivered") {
    return "Delivered";
  }
  if (fStatus === "shipped") {
    return "Shipped";
  }
  return "Order placed";
}

export function getDerivedPaymentStatus(order: { payment_status?: string }): string {
  const pStatus = (order.payment_status || "").toLowerCase();
  if (pStatus === "captured") {
    return "Payment: received";
  }
  return "Payment: pay on delivery";
}

export interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
}

export interface MedusaApiError extends Error {
  status?: number;
  data?: unknown;
}

// Low-level fetch wrapper that always sends the required headers
export async function medusaFetch<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type only if body is provided and not already specified
  if (rest.body && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const url = `${BACKEND_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  const text = await res.text();
  let parsedData: unknown = null;
  try {
    parsedData = text ? JSON.parse(text) : {};
  } catch {
    parsedData = { raw: text };
  }

  if (!res.ok) {
    const errorRecord = parsedData as Record<string, unknown> | null;
    const errorMsg =
      (errorRecord?.message as string) ||
      (errorRecord?.error as string) ||
      `Medusa API error (${res.status}): ${res.statusText}`;
    const err = new Error(errorMsg) as MedusaApiError;
    err.status = res.status;
    err.data = parsedData;
    throw err;
  }

  return parsedData as T;
}

// -------------------------------------------------------------
// Formatting & Currency Helpers
// -------------------------------------------------------------
// Medusa v2 amounts are in major units, do not divide by 100.
export function formatPrice(
  amount: number | null | undefined,
  currencyCode = "TND"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: 3,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode.toUpperCase()}`;
  }
}

// -------------------------------------------------------------
// Regions
// -------------------------------------------------------------
export async function getRegions(): Promise<Region[]> {
  const data = await medusaFetch<{ regions: Region[] }>("/store/regions", {
    next: { revalidate: 3600 },
  });
  return data.regions || [];
}

export async function getDefaultRegion(): Promise<Region> {
  const regions = await getRegions();
  // Find "Tunisie" or "TND", fallback to first region
  const match =
    regions.find(
      (r) =>
        r.name.toLowerCase().includes("tunisie") ||
        r.currency_code.toLowerCase() === "tnd"
    ) || regions[0];

  if (!match) {
    throw new Error("No regions configured on backend.");
  }
  return match;
}

// -------------------------------------------------------------
// Merchant Categories
// Rule: Use ONLY GET /store/merchant/categories
// -------------------------------------------------------------
export async function getCategories(): Promise<MerchantCategory[]> {
  try {
    const data = await medusaFetch<{ categories: MerchantCategory[]; count: number }>(
      "/store/merchant/categories",
      { next: { revalidate: 60 } }
    );
    return data.categories || [];
  } catch (err) {
    console.error("Error fetching merchant categories:", err);
    return [];
  }
}

// Helper to strip the internal sales channel prefix from category handles
// e.g. "sc_01m58jbtwzrj8r9vj9jy2yc1cm--electronics" -> "electronics"
export function cleanCategoryHandle(handle: string): string {
  if (!handle) return "";
  if (handle.includes("--")) {
    return handle.split("--").slice(1).join("--");
  }
  return handle;
}

export async function getCategoryByHandle(
  handle: string
): Promise<MerchantCategory | null> {
  const clean = cleanCategoryHandle(handle);
  try {
    const data = await medusaFetch<{ categories: MerchantCategory[]; count: number }>(
      `/store/merchant/categories?handle=${encodeURIComponent(clean)}`,
      { next: { revalidate: 60 } }
    );
    if (data.categories && data.categories.length > 0) {
      return data.categories[0];
    }
    // Fallback search in all categories in case backend query doesn't match
    const all = await getCategories();
    return (
      all.find(
        (c) =>
          c.handle.toLowerCase() === clean.toLowerCase() ||
          c.handle.toLowerCase() === handle.toLowerCase()
      ) || null
    );
  } catch (err) {
    console.error(`Error fetching category for handle ${handle}:`, err);
    return null;
  }
}

// -------------------------------------------------------------
// Products
// -------------------------------------------------------------
export async function getProducts(params?: {
  category_id?: string;
  limit?: number;
  offset?: number;
  order?: string;
}): Promise<Product[]> {
  const region = await getDefaultRegion();
  const searchParams = new URLSearchParams();
  searchParams.set("region_id", region.id);
  searchParams.set(
    "fields",
    "*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata"
  );
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.order) searchParams.set("order", params.order);
  if (params?.category_id) {
    searchParams.append("category_id[]", params.category_id);
  }

  const data = await medusaFetch<{ products: Product[] }>(
    `/store/products?${searchParams.toString()}`,
    { cache: "no-store" }
  );
  return data.products || [];
}

export async function getAllProducts(params?: {
  category_id?: string | string[];
  order?: string;
}): Promise<Product[]> {
  const region = await getDefaultRegion();
  const allProducts: Product[] = [];
  const limit = 100;
  let offset = 0;
  const maxProducts = 500;

  while (offset < maxProducts) {
    const searchParams = new URLSearchParams();
    searchParams.set("region_id", region.id);
    searchParams.set(
      "fields",
      "*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata,*options,*options.values,*variants.options,+created_at"
    );
    searchParams.set("limit", limit.toString());
    searchParams.set("offset", offset.toString());

    if (params?.category_id) {
      if (Array.isArray(params.category_id)) {
        params.category_id.forEach((catId) =>
          searchParams.append("category_id[]", catId)
        );
      } else {
        searchParams.append("category_id[]", params.category_id);
      }
    }
    if (params?.order) {
      searchParams.set("order", params.order);
    }

    const data = await medusaFetch<{ products: Product[]; count?: number }>(
      `/store/products?${searchParams.toString()}`,
      { cache: "no-store" }
    );

    const products = data.products || [];
    allProducts.push(...products);

    const totalCount =
      typeof data.count === "number" ? data.count : products.length;
    offset += products.length;

    if (
      products.length < limit ||
      offset >= totalCount ||
      allProducts.length >= maxProducts
    ) {
      break;
    }
  }

  return allProducts.slice(0, maxProducts);
}

export async function getProductByHandle(
  handle: string
): Promise<Product | null> {
  const region = await getDefaultRegion();
  const searchParams = new URLSearchParams();
  searchParams.set("handle", handle);
  searchParams.set("region_id", region.id);
  searchParams.set(
    "fields",
    "*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata"
  );

  const data = await medusaFetch<{ products: Product[] }>(
    `/store/products?${searchParams.toString()}`,
    { cache: "no-store" }
  );

  return data.products?.[0] || null;
}

// -------------------------------------------------------------
// Storefront banners: hero slides and promo banners
// Set by the merchant in the portal (Settings > Appearance). Never hardcode them.
// -------------------------------------------------------------
export type BannerLinkType = "none" | "shop" | "category" | "product";

export interface Banner {
  id: string;
  image_url: string;
  // Small text above the title: a badge or a collection name
  label: string;
  title: string;
  text: string;
  button_label: string;
  link: { type: BannerLinkType; handle?: string };
}

export interface StorefrontContent {
  hero_slides: Banner[];
  promo_banners: Banner[];
}

// The banners are decoration: if they cannot be loaded the page still works
// and shows its defaults.
export async function getStorefrontContent(): Promise<StorefrontContent> {
  try {
    const data = await medusaFetch<Partial<StorefrontContent>>(
      "/store/merchant/storefront",
      { cache: "no-store" }
    );
    return {
      hero_slides: Array.isArray(data.hero_slides) ? data.hero_slides : [],
      promo_banners: Array.isArray(data.promo_banners) ? data.promo_banners : [],
    };
  } catch (err) {
    console.error("Error fetching storefront banners:", err);
    return { hero_slides: [], promo_banners: [] };
  }
}

// Where a banner goes. A banner never links outside the store.
export function bannerHref(link: Banner["link"]): string | null {
  switch (link?.type) {
    case "shop":
      return "/shop";
    case "category":
      return link.handle ? `/c/${cleanCategoryHandle(link.handle)}` : null;
    case "product":
      return link.handle ? `/p/${encodeURIComponent(link.handle)}` : null;
    default:
      return null;
  }
}

// -------------------------------------------------------------
// Cart Management
// -------------------------------------------------------------
export async function getCart(
  cartId: string,
  token?: string
): Promise<Cart | null> {
  try {
    const data = await medusaFetch<{ cart: Cart }>(`/store/carts/${cartId}`, {
      token,
      cache: "no-store",
    });
    return data.cart || null;
  } catch (err: unknown) {
    if ((err as MedusaApiError)?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createCart(token?: string): Promise<Cart> {
  const region = await getDefaultRegion();
  const data = await medusaFetch<{ cart: Cart }>("/store/carts", {
    method: "POST",
    token,
    body: JSON.stringify({
      region_id: region.id,
    }),
  });
  return data.cart;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1,
  token?: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        variant_id: variantId,
        quantity,
      }),
    }
  );
  return data.cart;
}

export async function updateCartItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
  token?: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ quantity }),
    }
  );
  return data.cart;
}

export async function removeCartItem(
  cartId: string,
  lineItemId: string,
  token?: string
): Promise<Cart> {
  await medusaFetch(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "DELETE",
    token,
  });
  // Fetch fresh cart state
  const fresh = await getCart(cartId, token);
  if (!fresh) throw new Error("Cart not found after item deletion");
  return fresh;
}

export async function updateCart(
  cartId: string,
  updates: {
    email?: string;
    shipping_address?: Partial<Address>;
    billing_address?: Partial<Address>;
  },
  token?: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/store/carts/${cartId}`, {
    method: "POST",
    token,
    body: JSON.stringify(updates),
  });
  return data.cart;
}

export async function linkCartToCustomer(
  cartId: string,
  token: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/customer`,
    {
      method: "POST",
      token,
    }
  );
  return data.cart;
}

// -------------------------------------------------------------
// Checkout
// -------------------------------------------------------------
export async function getShippingOptions(
  cartId: string
): Promise<ShippingOption[]> {
  try {
    const data = await medusaFetch<{ shipping_options: ShippingOption[] }>(
      `/store/shipping-options?cart_id=${cartId}`,
      { cache: "no-store" }
    );
    return data.shipping_options || [];
  } catch (err) {
    console.error("Error fetching shipping options:", err);
    throw err;
  }
}

export async function addShippingMethod(
  cartId: string,
  optionId: string,
  token?: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/shipping-methods`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ option_id: optionId }),
    }
  );
  return data.cart;
}

export async function createPaymentCollection(
  cartId: string,
  token?: string
): Promise<{ id: string; amount: number; payment_sessions: unknown[] }> {
  const data = await medusaFetch<{
    payment_collection: { id: string; amount: number; payment_sessions: unknown[] };
  }>("/store/payment-collections", {
    method: "POST",
    token,
    body: JSON.stringify({ cart_id: cartId }),
  });
  return data.payment_collection;
}

export async function createPaymentSession(
  paymentCollectionId: string,
  providerId = "pp_system_default",
  token?: string
): Promise<{ id: string; amount: number; payment_sessions: unknown[] }> {
  const data = await medusaFetch<{
    payment_collection: { id: string; amount: number; payment_sessions: unknown[] };
  }>(`/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
    method: "POST",
    token,
    body: JSON.stringify({ provider_id: providerId }),
  });
  return data.payment_collection;
}

export async function completeCart(
  cartId: string,
  token?: string
): Promise<{ type: string; order?: Order; cart?: Cart; error?: unknown }> {
  try {
    const data = await medusaFetch<{ type: string; order?: Order; cart?: Cart }>(
      `/store/carts/${cartId}/complete`,
      {
        method: "POST",
        token,
      }
    );
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("shipping profile")) {
      throw new Error(
        "Cart items require shipping profiles that are not satisfied by the selected shipping option. Please contact the merchant."
      );
    }
    throw err;
  }
}

// -------------------------------------------------------------
// Orders
// -------------------------------------------------------------
export async function getOrder(
  orderId: string,
  token?: string
): Promise<Order | null> {
  try {
    const data = await medusaFetch<{ order: Order }>(
      `/store/orders/${orderId}`,
      {
        token,
        cache: "no-store",
      }
    );
    return data.order || null;
  } catch (err: unknown) {
    const status = (err as MedusaApiError)?.status;
    if (status === 404 || status === 400) {
      return null;
    }
    throw err;
  }
}

// Moves the guest orders named in orderIds to the logged-in customer. The backend
// only moves orders of this merchant that were placed as a guest with the same
// email; everything else is skipped quietly.
export async function claimGuestOrders(
  token: string,
  orderIds: string[]
): Promise<{ claimed: string[]; already_yours: string[] }> {
  return medusaFetch<{ claimed: string[]; already_yours: string[] }>(
    "/store/merchant/claim-orders",
    {
      method: "POST",
      token,
      body: JSON.stringify({ order_ids: orderIds }),
    }
  );
}

export async function getCustomerOrders(token: string): Promise<Order[]> {
  try {
    const data = await medusaFetch<{ orders: Order[] }>("/store/orders", {
      token,
      cache: "no-store",
    });
    return data.orders || [];
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    return [];
  }
}

// -------------------------------------------------------------
// Customer Auth & Profile
// -------------------------------------------------------------
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ token: string }> {
  const data = await medusaFetch<{ token: string }>(
    "/auth/customer/emailpass",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  return data;
}

export async function registerCustomer(params: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<{ token: string; customer: Customer }> {
  // 1. Register with emailpass
  const authData = await medusaFetch<{ token: string }>(
    "/auth/customer/emailpass/register",
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        password: params.password,
      }),
    }
  );

  // 2. Create customer entity using register token
  const custData = await medusaFetch<{ customer: Customer }>("/store/customers", {
    method: "POST",
    token: authData.token,
    body: JSON.stringify({
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
    }),
  });

  // 3. Immediately log in with emailpass to get the customer token with actor_id
  const loginData = await loginCustomer(params.email, params.password);

  return {
    token: loginData.token,
    customer: custData.customer,
  };
}

export async function getCustomer(token: string): Promise<Customer | null> {
  try {
    const data = await medusaFetch<{ customer: Customer }>(
      "/store/customers/me",
      {
        token,
        cache: "no-store",
      }
    );
    return data.customer || null;
  } catch {
    return null;
  }
}
