import type { OrderStatus } from "./order-status";
import type { OrderItem } from "./order-item";

/**
 * Store-scoped customer order with snapshotted line items.
 */
export interface Order {
  readonly id: string;
  readonly storeId: string;
  readonly customerId?: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly subtotal: string;
  readonly currency: string;
  readonly items: readonly OrderItem[];
  readonly confirmedAt?: string;
  readonly cancelledAt?: string;
  readonly fulfilledAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
