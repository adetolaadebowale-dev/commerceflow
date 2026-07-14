import type { ProductStatus } from "./product-status";
import type { ProductVariant } from "./product-variant";

/**
 * Catalog product with one or more purchasable variants.
 */
export interface Product {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly status: ProductStatus;
  readonly categoryId: string;
  readonly brandId?: string;
  readonly variants: readonly ProductVariant[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
