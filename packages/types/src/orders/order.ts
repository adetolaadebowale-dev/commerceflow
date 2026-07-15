import type { OrderPromotionSnapshot } from "../promotion-redemption/order-promotion-snapshot";
import type { OrderTaxRateSnapshot } from "../tax-rates/order-tax-rate-snapshot";
import type { OrderShippingMethodSnapshot } from "../shipping-configuration/order-shipping-method-snapshot";
import type { OrderAddressSnapshot } from "./order-address-snapshot";
import type { OrderStatus } from "./order-status";
import type { OrderItem } from "./order-item";

/**
 * Store-scoped customer order with snapshotted line items.
 */
export interface Order {
  readonly id: string;
  readonly storeId: string;
  readonly customerId?: string;
  readonly customerProfileId?: string;
  readonly sourceCartId?: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly shippingAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly appliedPromotion?: OrderPromotionSnapshot;
  readonly appliedTaxRate?: OrderTaxRateSnapshot;
  readonly appliedShippingMethod?: OrderShippingMethodSnapshot;
  readonly shippingAddress?: OrderAddressSnapshot;
  readonly items: readonly OrderItem[];
  readonly confirmedAt?: string;
  readonly cancelledAt?: string;
  readonly fulfilledAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
