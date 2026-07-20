/**
 * Purchasable SKU belonging to a product.
 */
export interface ProductVariant {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly price: string;
  readonly currency: string;
  readonly attributes?: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** List payload for product variants. */
export interface ProductVariantListResponse {
  readonly items: readonly ProductVariant[];
}
