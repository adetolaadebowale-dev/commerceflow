import type { DomainEvent } from "@commerceflow/types";

import type { DomainEventDispatcher } from "./dispatcher";
import {
  buildCartCreatedEvent,
  buildCartItemAddedEvent,
  buildCartItemRemovedEvent,
  buildCartItemUpdatedEvent,
  buildCheckoutCompletedEvent,
  buildCheckoutShippingSelectedEvent,
  buildCustomerAddressCreatedEvent,
  buildCustomerAddressUpdatedEvent,
  buildCustomerCreatedEvent,
  buildCustomerUpdatedEvent,
  buildInventoryReleasedEvent,
  buildInventoryReservedEvent,
  buildOrderCancelledEvent,
  buildOrderConfirmedEvent,
  buildOrderFulfilledEvent,
  buildPaymentAuthorizedEvent,
  buildPaymentCancelledEvent,
  buildPaymentCreatedEvent,
  buildPaymentFailedEvent,
  buildPaymentPaidEvent,
  buildInvoiceCreatedEvent,
  buildInvoiceIssuedEvent,
  buildInvoicePaidEvent,
  buildInvoiceVoidedEvent,
  buildRefundCancelledEvent,
  buildRefundCompletedEvent,
  buildRefundCreatedEvent,
  buildPromotionCreatedEvent,
  buildPromotionDeletedEvent,
  buildPromotionUpdatedEvent,
  buildPromotionAppliedEvent,
  buildPromotionRemovedEvent,
  buildTaxCreatedEvent,
  buildTaxUpdatedEvent,
  buildTaxActivatedEvent,
  buildTaxDeactivatedEvent,
  buildShipmentCreatedEvent,
  buildShipmentShippedEvent,
  buildShipmentDeliveredEvent,
  buildShipmentCancelledEvent,
  buildShipmentTrackingUpdatedEvent,
  buildShippingZoneCreatedEvent,
  buildShippingZoneUpdatedEvent,
  buildShippingZoneDeletedEvent,
  buildShippingMethodCreatedEvent,
  buildShippingMethodUpdatedEvent,
  buildShippingMethodDeletedEvent,
} from "./domain-event-factory";
import type {
  Cart,
  CartItem,
  CheckoutResult,
  Customer,
  CustomerAddress,
  InventoryReservation,
  Order,
  OrderShippingMethodSnapshot,
  OrderFulfillmentResult,
  OrderStatus,
  Payment,
  PaymentStatus,
  Invoice,
  InvoiceStatus,
  Refund,
  RefundStatus,
  Promotion,
  AppliedCartPromotion,
  TaxRate,
  TaxRateStatus,
  Shipment,
  ShipmentStatus,
  ShipmentTrackingEvent,
  ShippingZone,
  ShippingMethod,
} from "@commerceflow/types";

export interface DomainEventPublisherDependencies {
  readonly dispatcher?: DomainEventDispatcher;
  readonly onDispatchFailure?: (error: unknown, event: DomainEvent) => void;
}

export class DomainEventPublisher {
  private readonly dispatcher: DomainEventDispatcher;
  private readonly onDispatchFailure: (
    error: unknown,
    event: DomainEvent,
  ) => void;

  constructor(dependencies: DomainEventPublisherDependencies) {
    if (!dependencies.dispatcher) {
      throw new Error("DomainEventPublisher requires a dispatcher");
    }

    this.dispatcher = dependencies.dispatcher;
    this.onDispatchFailure =
      dependencies.onDispatchFailure ??
      ((error, event) => {
        console.error("Domain event dispatch failed", {
          error,
          eventType: event.eventType,
          eventId: event.id,
        });
      });
  }

  publishOrderConfirmed(order: Order, previousStatus: OrderStatus): void {
    this.dispatch(buildOrderConfirmedEvent(order, previousStatus));
  }

  publishOrderCancelled(order: Order, previousStatus: OrderStatus): void {
    this.dispatch(buildOrderCancelledEvent(order, previousStatus));
  }

  publishOrderFulfilled(result: OrderFulfillmentResult): void {
    this.dispatch(buildOrderFulfilledEvent(result));
  }

  publishInventoryReserved(
    orderId: string,
    storeId: string,
    reservations: readonly InventoryReservation[],
  ): void {
    this.dispatch(
      buildInventoryReservedEvent(orderId, storeId, reservations),
    );
  }

  publishInventoryReleased(reservation: InventoryReservation): void {
    this.dispatch(buildInventoryReleasedEvent(reservation));
  }

  publishCustomerCreated(customer: Customer): void {
    this.dispatch(buildCustomerCreatedEvent(customer));
  }

  publishCustomerUpdated(customer: Customer): void {
    this.dispatch(buildCustomerUpdatedEvent(customer));
  }

  publishCustomerAddressCreated(customerAddress: CustomerAddress): void {
    this.dispatch(buildCustomerAddressCreatedEvent(customerAddress));
  }

  publishCustomerAddressUpdated(customerAddress: CustomerAddress): void {
    this.dispatch(buildCustomerAddressUpdatedEvent(customerAddress));
  }

  publishCartCreated(cart: Cart): void {
    this.dispatch(buildCartCreatedEvent(cart));
  }

  publishCartItemAdded(cart: Cart, cartItem: CartItem): void {
    this.dispatch(buildCartItemAddedEvent(cart, cartItem));
  }

  publishCartItemUpdated(cart: Cart, cartItem: CartItem): void {
    this.dispatch(buildCartItemUpdatedEvent(cart, cartItem));
  }

  publishCartItemRemoved(
    cart: Cart,
    cartItemId: string,
    productVariantId: string,
  ): void {
    this.dispatch(buildCartItemRemovedEvent(cart, cartItemId, productVariantId));
  }

  publishCheckoutCompleted(
    result: CheckoutResult,
    customerAddressId: string,
  ): void {
    this.dispatch(buildCheckoutCompletedEvent(result, customerAddressId));
  }

  publishCheckoutShippingSelected(
    order: Order,
    appliedShippingMethod: OrderShippingMethodSnapshot,
    shippingAmount: string,
  ): void {
    this.dispatch(
      buildCheckoutShippingSelectedEvent(order, appliedShippingMethod, shippingAmount),
    );
  }

  publishPaymentCreated(payment: Payment): void {
    this.dispatch(buildPaymentCreatedEvent(payment));
  }

  publishPaymentAuthorized(
    payment: Payment,
    previousStatus: PaymentStatus,
  ): void {
    this.dispatch(buildPaymentAuthorizedEvent(payment, previousStatus));
  }

  publishPaymentPaid(payment: Payment, previousStatus: PaymentStatus): void {
    this.dispatch(buildPaymentPaidEvent(payment, previousStatus));
  }

  publishPaymentFailed(payment: Payment, previousStatus: PaymentStatus): void {
    this.dispatch(buildPaymentFailedEvent(payment, previousStatus));
  }

  publishPaymentCancelled(
    payment: Payment,
    previousStatus: PaymentStatus,
  ): void {
    this.dispatch(buildPaymentCancelledEvent(payment, previousStatus));
  }

  publishInvoiceCreated(invoice: Invoice): void {
    this.dispatch(buildInvoiceCreatedEvent(invoice));
  }

  publishInvoiceIssued(
    invoice: Invoice,
    previousStatus: InvoiceStatus,
  ): void {
    this.dispatch(buildInvoiceIssuedEvent(invoice, previousStatus));
  }

  publishInvoicePaid(invoice: Invoice, previousStatus: InvoiceStatus): void {
    this.dispatch(buildInvoicePaidEvent(invoice, previousStatus));
  }

  publishInvoiceVoided(
    invoice: Invoice,
    previousStatus: InvoiceStatus,
  ): void {
    this.dispatch(buildInvoiceVoidedEvent(invoice, previousStatus));
  }

  publishRefundCreated(refund: Refund): void {
    this.dispatch(buildRefundCreatedEvent(refund));
  }

  publishRefundCompleted(
    refund: Refund,
    previousStatus: RefundStatus,
  ): void {
    this.dispatch(buildRefundCompletedEvent(refund, previousStatus));
  }

  publishRefundCancelled(
    refund: Refund,
    previousStatus: RefundStatus,
  ): void {
    this.dispatch(buildRefundCancelledEvent(refund, previousStatus));
  }

  publishPromotionCreated(promotion: Promotion): void {
    this.dispatch(buildPromotionCreatedEvent(promotion));
  }

  publishPromotionUpdated(promotion: Promotion): void {
    this.dispatch(buildPromotionUpdatedEvent(promotion));
  }

  publishPromotionDeleted(promotion: Promotion): void {
    this.dispatch(buildPromotionDeletedEvent(promotion));
  }

  publishPromotionApplied(cart: Cart, applied: AppliedCartPromotion): void {
    this.dispatch(buildPromotionAppliedEvent(cart, applied));
  }

  publishPromotionRemoved(cart: Cart, applied: AppliedCartPromotion): void {
    this.dispatch(buildPromotionRemovedEvent(cart, applied));
  }

  publishTaxCreated(taxRate: TaxRate): void {
    this.dispatch(buildTaxCreatedEvent(taxRate));
  }

  publishTaxUpdated(taxRate: TaxRate): void {
    this.dispatch(buildTaxUpdatedEvent(taxRate));
  }

  publishTaxActivated(
    taxRate: TaxRate,
    previousStatus: TaxRateStatus,
  ): void {
    this.dispatch(buildTaxActivatedEvent(taxRate, previousStatus));
  }

  publishTaxDeactivated(
    taxRate: TaxRate,
    previousStatus: TaxRateStatus,
  ): void {
    this.dispatch(buildTaxDeactivatedEvent(taxRate, previousStatus));
  }

  publishShipmentCreated(shipment: Shipment): void {
    this.dispatch(buildShipmentCreatedEvent(shipment));
  }

  publishShipmentShipped(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentShippedEvent(shipment, previousStatus));
  }

  publishShipmentDelivered(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentDeliveredEvent(shipment, previousStatus));
  }

  publishShipmentCancelled(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentCancelledEvent(shipment, previousStatus));
  }

  publishShipmentTrackingUpdated(
    shipment: Shipment,
    trackingEvent: ShipmentTrackingEvent,
  ): void {
    this.dispatch(buildShipmentTrackingUpdatedEvent(shipment, trackingEvent));
  }

  publishShippingZoneCreated(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneCreatedEvent(shippingZone));
  }

  publishShippingZoneUpdated(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneUpdatedEvent(shippingZone));
  }

  publishShippingZoneDeleted(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneDeletedEvent(shippingZone));
  }

  publishShippingMethodCreated(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodCreatedEvent(shippingMethod));
  }

  publishShippingMethodUpdated(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodUpdatedEvent(shippingMethod));
  }

  publishShippingMethodDeleted(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodDeletedEvent(shippingMethod));
  }

  private dispatch(event: DomainEvent): void {
    void this.dispatcher.publish(event).catch((error) => {
      this.onDispatchFailure(error, event);
    });
  }
}
