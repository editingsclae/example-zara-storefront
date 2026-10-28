// The storefront remembers the ids of the orders a shopper placed as a guest, in
// this browser only. After the shopper logs in or registers, the ids go to the
// backend, which moves the orders that really belong to that email to the
// account. The ids are the proof of ownership: the email alone proves nothing,
// because anyone can register with somebody else's email.

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
