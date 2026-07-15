/** Shipment lifecycle status values. */
export const SHIPMENT_STATUSES = [
  "pending",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
