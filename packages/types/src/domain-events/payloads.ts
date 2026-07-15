import type { Order } from "../orders/order";
import type { OrderStatus } from "../orders/order-status";
import type { OrderFulfillmentResult } from "../fulfillment/order-fulfillment-result";
import type { InventoryReservation } from "../reservations/inventory-reservation";

import type { Customer } from "../customers/customer";
import type { CustomerAddress } from "../customers/customer-address";
import type { Cart } from "../shopping-cart/cart";
import type { CartItem } from "../shopping-cart/cart-item";
import type { CheckoutResult } from "../checkout/checkout-result";
import type { Invoice } from "../invoices/invoice";
import type { InvoiceStatus } from "../invoices/invoice-status";
import type { Refund } from "../refunds/refund";
import type { RefundStatus } from "../refunds/refund-status";
import type { Promotion } from "../promotions/promotion";
import type { Payment } from "../payments/payment";
import type { PaymentStatus } from "../payments/payment-status";

export interface OrderConfirmedPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly previousStatus: OrderStatus;
  readonly status: "confirmed";
  readonly confirmedAt?: string;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly itemCount: number;
}

export interface OrderCancelledPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly previousStatus: OrderStatus;
  readonly status: "cancelled";
  readonly cancelledAt?: string;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly itemCount: number;
}

export interface OrderFulfilledPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: "fulfilled";
  readonly fulfilledAt?: string;
  readonly reservationCount: number;
  readonly stockMovementCount: number;
  readonly order: Order;
  readonly result: OrderFulfillmentResult;
}

export interface InventoryReservedPayload {
  readonly orderId: string;
  readonly reservationCount: number;
  readonly reservations: readonly InventoryReservation[];
}

export interface InventoryReleasedPayload {
  readonly reservationId: string;
  readonly orderId: string;
  readonly orderItemId: string;
  readonly inventoryItemId: string;
  readonly reservedQuantity: number;
  readonly releasedAt?: string;
  readonly reservation: InventoryReservation;
}

export interface CustomerCreatedPayload {
  readonly customerId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly status: Customer["status"];
  readonly customer: Customer;
}

export interface CustomerUpdatedPayload {
  readonly customerId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly status: Customer["status"];
  readonly customer: Customer;
}

export interface CustomerAddressCreatedPayload {
  readonly customerAddressId: string;
  readonly customerId: string;
  readonly label: string;
  readonly isDefault: boolean;
  readonly customerAddress: CustomerAddress;
}

export interface CustomerAddressUpdatedPayload {
  readonly customerAddressId: string;
  readonly customerId: string;
  readonly label: string;
  readonly isDefault: boolean;
  readonly customerAddress: CustomerAddress;
}

export interface CartCreatedPayload {
  readonly cartId: string;
  readonly customerId: string;
  readonly status: Cart["status"];
  readonly cart: Cart;
}

export interface CartItemAddedPayload {
  readonly cartId: string;
  readonly cartItemId: string;
  readonly productVariantId: string;
  readonly quantity: number;
  readonly cartItem: CartItem;
  readonly cart: Cart;
}

export interface CartItemUpdatedPayload {
  readonly cartId: string;
  readonly cartItemId: string;
  readonly productVariantId: string;
  readonly quantity: number;
  readonly cartItem: CartItem;
  readonly cart: Cart;
}

export interface CartItemRemovedPayload {
  readonly cartId: string;
  readonly cartItemId: string;
  readonly productVariantId: string;
  readonly cart: Cart;
}

export interface CheckoutCompletedPayload {
  readonly cartId: string;
  readonly orderId: string;
  readonly customerProfileId: string;
  readonly customerAddressId: string;
  readonly order: Order;
  readonly cart: Cart;
  readonly result: CheckoutResult;
}

export interface PaymentCreatedPayload {
  readonly paymentId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: Payment["provider"];
  readonly reference: string;
  readonly payment: Payment;
}

export interface PaymentAuthorizedPayload {
  readonly paymentId: string;
  readonly orderId: string;
  readonly previousStatus: PaymentStatus;
  readonly status: "authorized";
  readonly amount: string;
  readonly currency: string;
  readonly payment: Payment;
}

export interface PaymentPaidPayload {
  readonly paymentId: string;
  readonly orderId: string;
  readonly previousStatus: PaymentStatus;
  readonly status: "paid";
  readonly amount: string;
  readonly currency: string;
  readonly payment: Payment;
}

export interface PaymentFailedPayload {
  readonly paymentId: string;
  readonly orderId: string;
  readonly previousStatus: PaymentStatus;
  readonly status: "failed";
  readonly amount: string;
  readonly currency: string;
  readonly payment: Payment;
}

export interface PaymentCancelledPayload {
  readonly paymentId: string;
  readonly orderId: string;
  readonly previousStatus: PaymentStatus;
  readonly status: "cancelled";
  readonly amount: string;
  readonly currency: string;
  readonly payment: Payment;
}

export interface InvoiceCreatedPayload {
  readonly invoiceId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly invoice: Invoice;
}

export interface InvoiceIssuedPayload {
  readonly invoiceId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly previousStatus: InvoiceStatus;
  readonly status: "issued";
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly issuedAt?: string;
  readonly invoice: Invoice;
}

export interface InvoicePaidPayload {
  readonly invoiceId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly previousStatus: InvoiceStatus;
  readonly status: "paid";
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly paidAt?: string;
  readonly invoice: Invoice;
}

export interface InvoiceVoidedPayload {
  readonly invoiceId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly previousStatus: InvoiceStatus;
  readonly status: "void";
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly invoice: Invoice;
}

export interface RefundCreatedPayload {
  readonly refundId: string;
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: RefundStatus;
  readonly reason: string;
  readonly refund: Refund;
}

export interface RefundCompletedPayload {
  readonly refundId: string;
  readonly paymentId: string;
  readonly previousStatus: RefundStatus;
  readonly status: "completed";
  readonly amount: string;
  readonly currency: string;
  readonly reason: string;
  readonly completedAt?: string;
  readonly refund: Refund;
}

export interface RefundCancelledPayload {
  readonly refundId: string;
  readonly paymentId: string;
  readonly previousStatus: RefundStatus;
  readonly status: "cancelled";
  readonly amount: string;
  readonly currency: string;
  readonly reason: string;
  readonly refund: Refund;
}

export interface PromotionCreatedPayload {
  readonly promotionId: string;
  readonly code: string;
  readonly name: string;
  readonly type: Promotion["type"];
  readonly value: string;
  readonly currency?: string;
  readonly status: Promotion["status"];
  readonly promotion: Promotion;
}

export interface PromotionUpdatedPayload {
  readonly promotionId: string;
  readonly code: string;
  readonly name: string;
  readonly type: Promotion["type"];
  readonly value: string;
  readonly currency?: string;
  readonly status: Promotion["status"];
  readonly promotion: Promotion;
}

export interface PromotionDeletedPayload {
  readonly promotionId: string;
  readonly code: string;
  readonly name: string;
  readonly status: Promotion["status"];
  readonly promotion: Promotion;
}

export interface PromotionAppliedPayload {
  readonly cartId: string;
  readonly promotionId: string;
  readonly promotionCodeSnapshot: string;
  readonly promotionTypeSnapshot: Promotion["type"];
  readonly promotionValueSnapshot: string;
  readonly discountAmount: string;
  readonly cartSubtotal: string;
}

export interface PromotionRemovedPayload {
  readonly cartId: string;
  readonly promotionId: string;
  readonly promotionCodeSnapshot: string;
}
