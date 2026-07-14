import type { CartItem } from "./cart-item";
import type { CartStatus } from "./cart-status";

/** Store-scoped mutable shopping cart belonging to a customer. */
export interface Cart {
  readonly id: string;
  readonly storeId: string;
  readonly customerId: string;
  readonly status: CartStatus;
  readonly subtotal: string;
  readonly currency: string;
  readonly items: readonly CartItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
