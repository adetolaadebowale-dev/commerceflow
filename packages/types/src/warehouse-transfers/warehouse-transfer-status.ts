/** Lifecycle status of an internal warehouse transfer. */
export const WAREHOUSE_TRANSFER_STATUSES = [
  "draft",
  "approved",
  "in_transit",
  "received",
  "cancelled",
] as const;

export type WarehouseTransferStatus =
  (typeof WAREHOUSE_TRANSFER_STATUSES)[number];
