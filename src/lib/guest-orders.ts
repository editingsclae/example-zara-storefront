// The storefront remembers the ids of the orders a shopper placed as a guest, in
// this browser only. Since the email has to be confirmed with a code before
// orders are moved (and the backend then moves every guest order of that email),
// the ids are no longer needed as proof of ownership: they are only kept so the
// browser can be cleaned up once the orders are linked to the account.

const KEY = "guest_order_ids";
const MAX_IDS = 20;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    if (ids.length === 0) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, JSON.stringify(ids.slice(-MAX_IDS)));
    }
  } catch {
    // Storage can be blocked (private window); the link is a convenience only
  }
}

export function rememberGuestOrder(orderId: string) {
  const ids = read().filter((id) => id !== orderId);
  ids.push(orderId);
  write(ids);
}

export function getGuestOrderIds(): string[] {
  return read();
}

export function forgetGuestOrders(orderIds: string[]) {
  write(read().filter((id) => !orderIds.includes(id)));
}
