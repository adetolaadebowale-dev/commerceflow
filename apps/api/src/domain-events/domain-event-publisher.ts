import type { DomainEvent } from "@commerceflow/types";

import type { DomainEventDispatcher } from "./dispatcher";
import {
  buildCustomerCreatedEvent,
  buildCustomerUpdatedEvent,
  buildInventoryReleasedEvent,
  buildInventoryReservedEvent,
  buildOrderCancelledEvent,
  buildOrderConfirmedEvent,
  buildOrderFulfilledEvent,
} from "./domain-event-factory";
import type {
  Customer,
  InventoryReservation,
  Order,
  OrderFulfillmentResult,
  OrderStatus,
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

  private dispatch(event: DomainEvent): void {
    void this.dispatcher.publish(event).catch((error) => {
      this.onDispatchFailure(error, event);
    });
  }
}
