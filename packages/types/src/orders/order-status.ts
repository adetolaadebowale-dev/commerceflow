/** Lifecycle states for store-scoped orders. */
export const ORDER_STATUSES = ["draft", "confirmed", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
