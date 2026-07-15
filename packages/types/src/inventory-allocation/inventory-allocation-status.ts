/** Warehouse inventory allocation lifecycle statuses. */
export const INVENTORY_ALLOCATION_STATUSES = [
  "allocated",
  "partially_picked",
  "picked",
  "shortage",
] as const;

export type InventoryAllocationStatus =
  (typeof INVENTORY_ALLOCATION_STATUSES)[number];
