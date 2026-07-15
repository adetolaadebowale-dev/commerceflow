import type {
  CheckoutResult,
  OrderAddressSnapshot,
  OrderPromotionSnapshot,
  OrderShippingMethodSnapshot,
  OrderTaxRateSnapshot,
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
  readonly taxAmount?: string;
  readonly shippingAmount: string;
  readonly total: string;
  readonly currency: string;
  readonly items: readonly PreparedOrderItem[];
  readonly appliedPromotion?: OrderPromotionSnapshot;
  readonly appliedTaxRate?: OrderTaxRateSnapshot;
  readonly appliedShippingMethod: OrderShippingMethodSnapshot;
}

export interface CheckoutRepository {
  completeCheckout(record: CheckoutRecord): Promise<CheckoutResult>;
}
