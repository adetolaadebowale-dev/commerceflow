import type { Cart } from "../shopping-cart/cart";
import type { Order } from "../orders/order";

/** Result of converting an active cart into a draft order. */
export interface CheckoutResult {
  readonly order: Order;
  readonly cart: Cart;
}
