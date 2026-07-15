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
import type { TaxRate } from "../tax-rates/tax-rate";
import type { Shipment } from "../shipments/shipment";
import type { ShipmentStatus } from "../shipments/shipment-status";
import type { ShipmentTrackingEvent } from "../shipments/shipment-tracking-event";
import type { ShipmentPackage } from "../shipments/shipment-package";
import type { OrderShippingMethodSnapshot } from "../shipping-configuration/order-shipping-method-snapshot";
import type { ShippingZone } from "../shipping-configuration/shipping-zone";
import type { ShippingMethod } from "../shipping-configuration/shipping-method";
import type { PickList } from "../pick-lists/pick-list";
import type { PickListStatus } from "../pick-lists/pick-list-status";
import type { InventoryAllocation } from "../inventory-allocation/inventory-allocation";
import type { InventoryAllocationStatus } from "../inventory-allocation/inventory-allocation-status";
import type { ShipmentFulfillmentResult } from "../fulfillment/shipment-fulfillment-result";
import type { StockMovement } from "../stock-movement/stock-movement";
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

export interface CheckoutShippingSelectedPayload {
  readonly orderId: string;
  readonly shippingAmount: string;
  readonly appliedShippingMethod: OrderShippingMethodSnapshot;
  readonly order: Order;
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

export interface TaxCreatedPayload {
  readonly taxRateId: string;
  readonly name: string;
  readonly percentage: string;
  readonly status: TaxRate["status"];
  readonly taxRate: TaxRate;
}

export interface TaxUpdatedPayload {
  readonly taxRateId: string;
  readonly name: string;
  readonly percentage: string;
  readonly status: TaxRate["status"];
  readonly taxRate: TaxRate;
}

export interface TaxActivatedPayload {
  readonly taxRateId: string;
  readonly name: string;
  readonly percentage: string;
  readonly previousStatus: TaxRate["status"];
  readonly status: "active";
  readonly taxRate: TaxRate;
}

export interface TaxDeactivatedPayload {
  readonly taxRateId: string;
  readonly name: string;
  readonly percentage: string;
  readonly previousStatus: TaxRate["status"];
  readonly status: "inactive";
  readonly taxRate: TaxRate;
}

export interface ShipmentCreatedPayload {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly status: ShipmentStatus;
  readonly carrier: Shipment["carrier"];
  readonly shipment: Shipment;
}

export interface ShipmentShippedPayload {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly previousStatus: ShipmentStatus;
  readonly status: "shipped";
  readonly shippedAt?: string;
  readonly shipment: Shipment;
}

export interface ShipmentDeliveredPayload {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly previousStatus: ShipmentStatus;
  readonly status: "delivered";
  readonly deliveredAt?: string;
  readonly shipment: Shipment;
}

export interface ShipmentCancelledPayload {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly previousStatus: ShipmentStatus;
  readonly status: "cancelled";
  readonly shipment: Shipment;
}

export interface ShipmentTrackingUpdatedPayload {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly shipmentNumber: string;
  readonly statusSnapshot: ShipmentStatus;
  readonly trackingEvent: ShipmentTrackingEvent;
  readonly shipment: Shipment;
}

export interface ShipmentPackageCreatedPayload {
  readonly shipmentPackageId: string;
  readonly shipmentId: string;
  readonly packageNumber: string;
  readonly shipmentPackage: ShipmentPackage;
  readonly shipment: Shipment;
}

export interface ShipmentPackageUpdatedPayload {
  readonly shipmentPackageId: string;
  readonly shipmentId: string;
  readonly packageNumber: string;
  readonly shipmentPackage: ShipmentPackage;
  readonly shipment: Shipment;
}

export interface ShipmentPackageDeletedPayload {
  readonly shipmentPackageId: string;
  readonly shipmentId: string;
  readonly packageNumber: string;
  readonly shipmentPackage: ShipmentPackage;
  readonly shipment: Shipment;
}

export interface PickListCreatedPayload {
  readonly pickListId: string;
  readonly shipmentId: string;
  readonly status: PickListStatus;
  readonly pickList: PickList;
}

export interface PickListStartedPayload {
  readonly pickListId: string;
  readonly shipmentId: string;
  readonly previousStatus: "pending";
  readonly status: "picking";
  readonly pickList: PickList;
}

export interface PickListCompletedPayload {
  readonly pickListId: string;
  readonly shipmentId: string;
  readonly previousStatus: "picking";
  readonly status: "picked";
  readonly pickList: PickList;
}

export interface PickListPackedPayload {
  readonly pickListId: string;
  readonly shipmentId: string;
  readonly previousStatus: "picked";
  readonly status: "packed";
  readonly pickList: PickList;
}

export interface InventoryAllocatedPayload {
  readonly inventoryAllocationId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly quantityAllocated: number;
  readonly status: InventoryAllocationStatus;
  readonly inventoryAllocation: InventoryAllocation;
}

export interface InventoryPartiallyPickedPayload {
  readonly inventoryAllocationId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly previousStatus: InventoryAllocationStatus;
  readonly status: "partially_picked";
  readonly quantityPicked: number;
  readonly quantityAllocated: number;
  readonly inventoryAllocation: InventoryAllocation;
}

export interface InventoryPickedPayload {
  readonly inventoryAllocationId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly previousStatus: InventoryAllocationStatus;
  readonly status: "picked";
  readonly quantityPicked: number;
  readonly quantityAllocated: number;
  readonly inventoryAllocation: InventoryAllocation;
}

export interface InventoryShortageReportedPayload {
  readonly inventoryAllocationId: string;
  readonly pickListItemId: string;
  readonly inventoryItemId: string;
  readonly previousStatus: InventoryAllocationStatus;
  readonly status: "shortage";
  readonly shortageReason: string;
  readonly quantityPicked: number;
  readonly quantityAllocated: number;
  readonly inventoryAllocation: InventoryAllocation;
}

export interface InventoryFulfilledPayload {
  readonly shipmentId: string;
  readonly shipmentNumber: string;
  readonly stockMovementCount: number;
  readonly allocationCount: number;
  readonly result: ShipmentFulfillmentResult;
}

export interface StockMovementCreatedPayload {
  readonly stockMovementId: string;
  readonly inventoryItemId: string;
  readonly movementType: StockMovement["movementType"];
  readonly quantity: number;
  readonly previousQuantityOnHand: number;
  readonly newQuantityOnHand: number;
  readonly shipmentId?: string;
  readonly inventoryAllocationId?: string;
  readonly stockMovement: StockMovement;
}

export interface ShippingZoneCreatedPayload {
  readonly shippingZoneId: string;
  readonly name: string;
  readonly countries: readonly string[];
  readonly status: ShippingZone["status"];
  readonly shippingZone: ShippingZone;
}

export interface ShippingZoneUpdatedPayload {
  readonly shippingZoneId: string;
  readonly name: string;
  readonly countries: readonly string[];
  readonly status: ShippingZone["status"];
  readonly shippingZone: ShippingZone;
}

export interface ShippingZoneDeletedPayload {
  readonly shippingZoneId: string;
  readonly name: string;
  readonly status: ShippingZone["status"];
  readonly shippingZone: ShippingZone;
}

export interface ShippingMethodCreatedPayload {
  readonly shippingMethodId: string;
  readonly shippingZoneId: string;
  readonly name: string;
  readonly carrier: ShippingMethod["carrier"];
  readonly flatRate: string;
  readonly currency: string;
  readonly status: ShippingMethod["status"];
  readonly shippingMethod: ShippingMethod;
}

export interface ShippingMethodUpdatedPayload {
  readonly shippingMethodId: string;
  readonly shippingZoneId: string;
  readonly name: string;
  readonly carrier: ShippingMethod["carrier"];
  readonly flatRate: string;
  readonly currency: string;
  readonly status: ShippingMethod["status"];
  readonly shippingMethod: ShippingMethod;
}

export interface ShippingMethodDeletedPayload {
  readonly shippingMethodId: string;
  readonly shippingZoneId: string;
  readonly name: string;
  readonly status: ShippingMethod["status"];
  readonly shippingMethod: ShippingMethod;
}
