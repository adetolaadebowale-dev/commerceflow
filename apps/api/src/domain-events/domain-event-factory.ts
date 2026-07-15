import type {
  DomainEvent,
  DomainAggregateType,
  DomainEventType,
  InventoryReleasedPayload,
  InventoryReservedPayload,
  InventoryReservation,
  Customer,
  CustomerAddress,
  CustomerAddressCreatedPayload,
  CustomerAddressUpdatedPayload,
  CustomerCreatedPayload,
  CustomerUpdatedPayload,
  Cart,
  CartCreatedPayload,
  CartItem,
  CartItemAddedPayload,
  CartItemRemovedPayload,
  CartItemUpdatedPayload,
  CheckoutCompletedPayload,
  CheckoutResult,
  Order,
  OrderCancelledPayload,
  OrderConfirmedPayload,
  OrderFulfilledPayload,
  OrderFulfillmentResult,
  OrderStatus,
  Payment,
  PaymentAuthorizedPayload,
  PaymentCancelledPayload,
  PaymentCreatedPayload,
  PaymentFailedPayload,
  PaymentPaidPayload,
  PaymentStatus,
  Invoice,
  InvoiceCreatedPayload,
  InvoiceIssuedPayload,
  InvoicePaidPayload,
  InvoiceStatus,
  InvoiceVoidedPayload,
  Refund,
  RefundCancelledPayload,
  RefundCompletedPayload,
  RefundCreatedPayload,
  RefundStatus,
  Promotion,
  PromotionCreatedPayload,
  PromotionDeletedPayload,
  PromotionUpdatedPayload,
  PromotionAppliedPayload,
  PromotionRemovedPayload,
  AppliedCartPromotion,
} from "@commerceflow/types";

export function createDomainEvent<TPayload>(input: {
  readonly eventType: DomainEventType;
  readonly aggregateType: DomainAggregateType;
  readonly aggregateId: string;
  readonly storeId: string | null;
  readonly payload: TPayload;
}): DomainEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    storeId: input.storeId,
    payload: input.payload,
  };
}

export function buildOrderConfirmedEvent(
  order: Order,
  previousStatus: OrderStatus,
): DomainEvent<OrderConfirmedPayload> {
  return createDomainEvent({
    eventType: "order.confirmed",
    aggregateType: "order",
    aggregateId: order.id,
    storeId: order.storeId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      status: "confirmed",
      confirmedAt: order.confirmedAt,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length,
    },
  });
}

export function buildOrderCancelledEvent(
  order: Order,
  previousStatus: OrderStatus,
): DomainEvent<OrderCancelledPayload> {
  return createDomainEvent({
    eventType: "order.cancelled",
    aggregateType: "order",
    aggregateId: order.id,
    storeId: order.storeId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      status: "cancelled",
      cancelledAt: order.cancelledAt,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length,
    },
  });
}

export function buildOrderFulfilledEvent(
  result: OrderFulfillmentResult,
): DomainEvent<OrderFulfilledPayload> {
  return createDomainEvent({
    eventType: "order.fulfilled",
    aggregateType: "order",
    aggregateId: result.order.id,
    storeId: result.order.storeId,
    payload: {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      status: "fulfilled",
      fulfilledAt: result.order.fulfilledAt,
      reservationCount: result.reservations.length,
      stockMovementCount: result.stockMovements.length,
      order: result.order,
      result,
    },
  });
}

export function buildInventoryReservedEvent(
  orderId: string,
  storeId: string,
  reservations: readonly InventoryReservation[],
): DomainEvent<InventoryReservedPayload> {
  return createDomainEvent({
    eventType: "inventory.reserved",
    aggregateType: "order",
    aggregateId: orderId,
    storeId,
    payload: {
      orderId,
      reservationCount: reservations.length,
      reservations,
    },
  });
}

export function buildInventoryReleasedEvent(
  reservation: InventoryReservation,
): DomainEvent<InventoryReleasedPayload> {
  return createDomainEvent({
    eventType: "inventory.released",
    aggregateType: "inventory_reservation",
    aggregateId: reservation.id,
    storeId: reservation.storeId,
    payload: {
      reservationId: reservation.id,
      orderId: reservation.orderId,
      orderItemId: reservation.orderItemId,
      inventoryItemId: reservation.inventoryItemId,
      reservedQuantity: reservation.reservedQuantity,
      releasedAt: reservation.releasedAt,
      reservation,
    },
  });
}

export function buildCustomerCreatedEvent(
  customer: Customer,
): DomainEvent<CustomerCreatedPayload> {
  return createDomainEvent({
    eventType: "customer.created",
    aggregateType: "customer",
    aggregateId: customer.id,
    storeId: customer.storeId,
    payload: {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      status: customer.status,
      customer,
    },
  });
}

export function buildCustomerUpdatedEvent(
  customer: Customer,
): DomainEvent<CustomerUpdatedPayload> {
  return createDomainEvent({
    eventType: "customer.updated",
    aggregateType: "customer",
    aggregateId: customer.id,
    storeId: customer.storeId,
    payload: {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      status: customer.status,
      customer,
    },
  });
}

export function buildCustomerAddressCreatedEvent(
  customerAddress: CustomerAddress,
): DomainEvent<CustomerAddressCreatedPayload> {
  return createDomainEvent({
    eventType: "customer.address.created",
    aggregateType: "customer_address",
    aggregateId: customerAddress.id,
    storeId: customerAddress.storeId,
    payload: {
      customerAddressId: customerAddress.id,
      customerId: customerAddress.customerId,
      label: customerAddress.label,
      isDefault: customerAddress.isDefault,
      customerAddress,
    },
  });
}

export function buildCustomerAddressUpdatedEvent(
  customerAddress: CustomerAddress,
): DomainEvent<CustomerAddressUpdatedPayload> {
  return createDomainEvent({
    eventType: "customer.address.updated",
    aggregateType: "customer_address",
    aggregateId: customerAddress.id,
    storeId: customerAddress.storeId,
    payload: {
      customerAddressId: customerAddress.id,
      customerId: customerAddress.customerId,
      label: customerAddress.label,
      isDefault: customerAddress.isDefault,
      customerAddress,
    },
  });
}

export function buildCartCreatedEvent(
  cart: Cart,
): DomainEvent<CartCreatedPayload> {
  return createDomainEvent({
    eventType: "cart.created",
    aggregateType: "cart",
    aggregateId: cart.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      customerId: cart.customerId,
      status: cart.status,
      cart,
    },
  });
}

export function buildCartItemAddedEvent(
  cart: Cart,
  cartItem: CartItem,
): DomainEvent<CartItemAddedPayload> {
  return createDomainEvent({
    eventType: "cart.item.added",
    aggregateType: "cart_item",
    aggregateId: cartItem.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId: cartItem.id,
      productVariantId: cartItem.productVariantId,
      quantity: cartItem.quantity,
      cartItem,
      cart,
    },
  });
}

export function buildCartItemUpdatedEvent(
  cart: Cart,
  cartItem: CartItem,
): DomainEvent<CartItemUpdatedPayload> {
  return createDomainEvent({
    eventType: "cart.item.updated",
    aggregateType: "cart_item",
    aggregateId: cartItem.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId: cartItem.id,
      productVariantId: cartItem.productVariantId,
      quantity: cartItem.quantity,
      cartItem,
      cart,
    },
  });
}

export function buildCartItemRemovedEvent(
  cart: Cart,
  cartItemId: string,
  productVariantId: string,
): DomainEvent<CartItemRemovedPayload> {
  return createDomainEvent({
    eventType: "cart.item.removed",
    aggregateType: "cart_item",
    aggregateId: cartItemId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId,
      productVariantId,
      cart,
    },
  });
}

export function buildCheckoutCompletedEvent(
  result: CheckoutResult,
  customerAddressId: string,
): DomainEvent<CheckoutCompletedPayload> {
  return createDomainEvent({
    eventType: "checkout.completed",
    aggregateType: "checkout",
    aggregateId: result.order.id,
    storeId: result.order.storeId,
    payload: {
      cartId: result.cart.id,
      orderId: result.order.id,
      customerProfileId: result.order.customerProfileId ?? result.cart.customerId,
      customerAddressId,
      order: result.order,
      cart: result.cart,
      result,
    },
  });
}

export function buildPaymentCreatedEvent(
  payment: Payment,
): DomainEvent<PaymentCreatedPayload> {
  return createDomainEvent({
    eventType: "payment.created",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      reference: payment.reference,
      payment,
    },
  });
}

export function buildPaymentAuthorizedEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentAuthorizedPayload> {
  return createDomainEvent({
    eventType: "payment.authorized",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "authorized",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentPaidEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentPaidPayload> {
  return createDomainEvent({
    eventType: "payment.paid",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "paid",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentFailedEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentFailedPayload> {
  return createDomainEvent({
    eventType: "payment.failed",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "failed",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentCancelledEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentCancelledPayload> {
  return createDomainEvent({
    eventType: "payment.cancelled",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "cancelled",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildInvoiceCreatedEvent(
  invoice: Invoice,
): DomainEvent<InvoiceCreatedPayload> {
  return createDomainEvent({
    eventType: "invoice.created",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      invoice,
    },
  });
}

export function buildInvoiceIssuedEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoiceIssuedPayload> {
  return createDomainEvent({
    eventType: "invoice.issued",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "issued",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt,
      invoice,
    },
  });
}

export function buildInvoicePaidEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoicePaidPayload> {
  return createDomainEvent({
    eventType: "invoice.paid",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "paid",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      paidAt: invoice.paidAt,
      invoice,
    },
  });
}

export function buildInvoiceVoidedEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoiceVoidedPayload> {
  return createDomainEvent({
    eventType: "invoice.voided",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "void",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      invoice,
    },
  });
}

export function buildRefundCreatedEvent(
  refund: Refund,
): DomainEvent<RefundCreatedPayload> {
  return createDomainEvent({
    eventType: "refund.created",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      refund,
    },
  });
}

export function buildRefundCompletedEvent(
  refund: Refund,
  previousStatus: RefundStatus,
): DomainEvent<RefundCompletedPayload> {
  return createDomainEvent({
    eventType: "refund.completed",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      previousStatus,
      status: "completed",
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      completedAt: refund.completedAt,
      refund,
    },
  });
}

export function buildRefundCancelledEvent(
  refund: Refund,
  previousStatus: RefundStatus,
): DomainEvent<RefundCancelledPayload> {
  return createDomainEvent({
    eventType: "refund.cancelled",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      previousStatus,
      status: "cancelled",
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      refund,
    },
  });
}

export function buildPromotionCreatedEvent(
  promotion: Promotion,
): DomainEvent<PromotionCreatedPayload> {
  return createDomainEvent({
    eventType: "promotion.created",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      currency: promotion.currency,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionUpdatedEvent(
  promotion: Promotion,
): DomainEvent<PromotionUpdatedPayload> {
  return createDomainEvent({
    eventType: "promotion.updated",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      currency: promotion.currency,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionDeletedEvent(
  promotion: Promotion,
): DomainEvent<PromotionDeletedPayload> {
  return createDomainEvent({
    eventType: "promotion.deleted",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionAppliedEvent(
  cart: Cart,
  applied: AppliedCartPromotion,
): DomainEvent<PromotionAppliedPayload> {
  return createDomainEvent({
    eventType: "promotion.applied",
    aggregateType: "promotion",
    aggregateId: applied.promotionId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      promotionId: applied.promotionId,
      promotionCodeSnapshot: applied.promotionCodeSnapshot,
      promotionTypeSnapshot: applied.promotionTypeSnapshot,
      promotionValueSnapshot: applied.promotionValueSnapshot,
      discountAmount: applied.discountAmount,
      cartSubtotal: cart.subtotal,
    },
  });
}

export function buildPromotionRemovedEvent(
  cart: Cart,
  applied: AppliedCartPromotion,
): DomainEvent<PromotionRemovedPayload> {
  return createDomainEvent({
    eventType: "promotion.removed",
    aggregateType: "promotion",
    aggregateId: applied.promotionId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      promotionId: applied.promotionId,
      promotionCodeSnapshot: applied.promotionCodeSnapshot,
    },
  });
}
