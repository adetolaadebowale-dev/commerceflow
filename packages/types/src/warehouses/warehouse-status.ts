/** Warehouse lifecycle status. */
export const WAREHOUSE_STATUSES = ["active", "inactive"] as const;

export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];
