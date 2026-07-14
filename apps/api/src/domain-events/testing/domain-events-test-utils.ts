import type { DomainEvent } from "@commerceflow/types";

import { InMemoryDomainEventDispatcher } from "../dispatcher";
import { DomainEventPublisher } from "../domain-event-publisher";
import { createDomainEvent } from "../domain-event-factory";

export function createTestDomainEventPublisher(options?: {
  onHandlerFailure?: (
    error: unknown,
    event: DomainEvent,
    handler: (event: DomainEvent) => void | Promise<void>,
  ) => void;
  onDispatchFailure?: (error: unknown, event: DomainEvent) => void;
}) {
  const dispatcher = new InMemoryDomainEventDispatcher({
    onHandlerFailure: options?.onHandlerFailure,
  });
  const publisher = new DomainEventPublisher({
    dispatcher,
    onDispatchFailure: options?.onDispatchFailure,
  });

  return { dispatcher, publisher };
}

export function sampleDomainEvent(
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
  return createDomainEvent({
    eventType: "order.confirmed",
    aggregateType: "order",
    aggregateId: "11111111-1111-1111-1111-111111111111",
    storeId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    payload: {
      orderId: "11111111-1111-1111-1111-111111111111",
      orderNumber: "ORD-001",
      previousStatus: "draft",
      status: "confirmed",
      subtotal: "19.99",
      currency: "USD",
      itemCount: 1,
    },
    ...overrides,
  });
}
