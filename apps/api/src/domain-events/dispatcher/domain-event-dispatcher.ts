import type { DomainEvent, DomainEventType } from "@commerceflow/types";

export type DomainEventHandler = (
  event: DomainEvent,
) => void | Promise<void>;

export interface DomainEventDispatcher {
  subscribe(
    eventType: DomainEventType,
    handler: DomainEventHandler,
  ): () => void;
  publish(event: DomainEvent): Promise<void>;
}
