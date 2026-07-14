export const CART_STATUSES = ["active", "converted", "abandoned"] as const;

export type CartStatus = (typeof CART_STATUSES)[number];
