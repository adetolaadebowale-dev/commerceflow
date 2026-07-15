export const SHIPPING_METHOD_STATUSES = ["active", "inactive"] as const;

export type ShippingMethodStatus = (typeof SHIPPING_METHOD_STATUSES)[number];
