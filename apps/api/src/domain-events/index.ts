import { InMemoryDomainEventDispatcher } from "./dispatcher";
import { DomainEventPublisher } from "./domain-event-publisher";

const dispatcher = new InMemoryDomainEventDispatcher();
const domainEventPublisher = new DomainEventPublisher({ dispatcher });

export function getDomainEventDispatcher(): InMemoryDomainEventDispatcher {
  return dispatcher;
}

export function getDomainEventPublisher(): DomainEventPublisher {
  return domainEventPublisher;
}

export { DomainEventPublisher } from "./domain-event-publisher";
export {
  buildInventoryReleasedEvent,
  buildInventoryReservedEvent,
  buildOrderCancelledEvent,
  buildOrderConfirmedEvent,
  buildOrderFulfilledEvent,
  createDomainEvent,
} from "./domain-event-factory";
export type {
  DomainEventDispatcher,
  DomainEventHandler,
} from "./dispatcher";
