import type { DomainEvent, DomainEventType } from "@commerceflow/types";

import type {
  DomainEventDispatcher,
  DomainEventHandler,
} from "./domain-event-dispatcher";

interface RegisteredHandler {
  readonly handler: DomainEventHandler;
}

export interface InMemoryDomainEventDispatcherOptions {
  readonly onHandlerFailure?: (
    error: unknown,
    event: DomainEvent,
    handler: DomainEventHandler,
  ) => void;
}

export class InMemoryDomainEventDispatcher implements DomainEventDispatcher {
  private readonly handlersByType = new Map<
    DomainEventType,
    RegisteredHandler[]
  >();
  private readonly onHandlerFailure: (
    error: unknown,
    event: DomainEvent,
    handler: DomainEventHandler,
  ) => void;

  constructor(options: InMemoryDomainEventDispatcherOptions = {}) {
    this.onHandlerFailure =
      options.onHandlerFailure ??
      ((error, event) => {
        console.error("Domain event handler failed", {
          error,
          eventType: event.eventType,
          eventId: event.id,
        });
      });
  }

  subscribe(
    eventType: DomainEventType,
    handler: DomainEventHandler,
  ): () => void {
    const registered: RegisteredHandler = { handler };
    const handlers = this.handlersByType.get(eventType) ?? [];
    handlers.push(registered);
    this.handlersByType.set(eventType, handlers);

    return () => {
      const current = this.handlersByType.get(eventType);

      if (!current) {
        return;
      }

      this.handlersByType.set(
        eventType,
        current.filter((entry) => entry.handler !== handler),
      );
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlersByType.get(event.eventType) ?? [];

    for (const { handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.onHandlerFailure(error, event, handler);
      }
    }
  }

  getHandlerCount(eventType: DomainEventType): number {
    return this.handlersByType.get(eventType)?.length ?? 0;
  }
}
