import type { DomainAggregateType } from "./aggregate-type";
import type { DomainEventType } from "./domain-event-type";

/** Immutable in-process domain event contract. */
export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly occurredAt: string;
  readonly eventType: DomainEventType;
  readonly aggregateType: DomainAggregateType;
  readonly aggregateId: string;
  readonly storeId: string | null;
  readonly payload: TPayload;
}
