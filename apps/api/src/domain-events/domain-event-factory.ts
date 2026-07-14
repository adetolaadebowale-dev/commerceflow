import type {
  DomainEvent,
  DomainAggregateType,
  DomainEventType,
  InventoryReleasedPayload,
  InventoryReservedPayload,
  InventoryReservation,
  Order,
  OrderCancelledPayload,
  OrderConfirmedPayload,
  OrderFulfilledPayload,
  OrderFulfillmentResult,
  OrderStatus,
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
