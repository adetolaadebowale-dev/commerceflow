/**
 * Line item belonging to an order with immutable product snapshot fields.
 */
export interface OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly productVariantId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: string;
  readonly currency: string;
  readonly quantity: number;
  readonly lineSubtotal: string;
  readonly createdAt: string;
}
