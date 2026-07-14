import type {
  CheckoutResult,
  OrderAddressSnapshot,
} from "@commerceflow/types";

import type { PreparedOrderItem } from "@/orders/repositories/order-create-record";

export interface CheckoutRecord {
  readonly storeId: string;
  readonly cartId: string;
  readonly customerProfileId: string;
  readonly customerAddressId: string;
  readonly shippingAddress: OrderAddressSnapshot;
  readonly subtotal: string;
  readonly currency: string;
  readonly items: readonly PreparedOrderItem[];
}

export interface CheckoutRepository {
  completeCheckout(record: CheckoutRecord): Promise<CheckoutResult>;
}
