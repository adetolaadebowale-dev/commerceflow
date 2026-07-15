import type {
  CheckoutResult,
  OrderAddressSnapshot,
  OrderPromotionSnapshot,
} from "@commerceflow/types";

import type { PreparedOrderItem } from "@/orders/repositories/order-create-record";

export interface CheckoutRecord {
  readonly storeId: string;
  readonly cartId: string;
  readonly customerProfileId: string;
  readonly customerAddressId: string;
  readonly shippingAddress: OrderAddressSnapshot;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly items: readonly PreparedOrderItem[];
  readonly appliedPromotion?: OrderPromotionSnapshot;
}

export interface CheckoutRepository {
  completeCheckout(record: CheckoutRecord): Promise<CheckoutResult>;
}
