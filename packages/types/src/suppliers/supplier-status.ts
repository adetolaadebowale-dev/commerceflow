/** Supplier lifecycle status. */
export const SUPPLIER_STATUSES = ["active", "inactive"] as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];
