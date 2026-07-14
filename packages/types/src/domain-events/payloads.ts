import type { Order } from "../orders/order";
import type { OrderStatus } from "../orders/order-status";
import type { OrderFulfillmentResult } from "../fulfillment/order-fulfillment-result";
import type { InventoryReservation } from "../reservations/inventory-reservation";

import type { Customer } from "../customers/customer";
import type { CustomerAddress } from "../customers/customer-address";

export interface OrderConfirmedPayload {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly previousStatus: OrderStatus;
  readonly status: "confirmed";
  readonly confirmedAt?: string;
  readonly subtotal: string;
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
