export const SHIPPING_ZONE_STATUSES = ["active", "inactive"] as const;

export type ShippingZoneStatus = (typeof SHIPPING_ZONE_STATUSES)[number];
