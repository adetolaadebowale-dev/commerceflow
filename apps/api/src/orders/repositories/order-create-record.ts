import type { OrderStatus } from "@commerceflow/types";

export interface OrderVariantSnapshot {
  readonly productVariantId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: string;
  readonly currency: string;
}

export interface PreparedOrderItem {
  readonly productVariantId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: string;
  readonly currency: string;
  readonly quantity: number;
  readonly lineSubtotal: string;
}

export interface CreateOrderRecord {
  readonly storeId: string;
  readonly customerId?: string;
  readonly status: OrderStatus;
  readonly subtotal: string;
  readonly currency: string;
  readonly items: readonly PreparedOrderItem[];
}
