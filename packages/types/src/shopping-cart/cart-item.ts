/** Mutable cart line with snapshotted pricing at add time. */
export interface CartItem {
  readonly id: string;
  readonly cartId: string;
  readonly productVariantId: string;
  readonly quantity: number;
  readonly unitPriceSnapshot: string;
  readonly currencySnapshot: string;
  readonly lineSubtotal: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
