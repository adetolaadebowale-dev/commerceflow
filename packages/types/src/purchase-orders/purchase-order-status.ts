/** Lifecycle status of a supplier purchase order. */
export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "approved",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[number];
