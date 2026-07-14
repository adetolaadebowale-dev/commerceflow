/**
 * Lifecycle state of a catalog product.
 */
export type ProductStatus = "draft" | "active" | "archived";

export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "archived",
] as const satisfies readonly ProductStatus[];
