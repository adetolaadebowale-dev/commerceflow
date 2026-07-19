import { InMemoryDomainEventDispatcher } from "./dispatcher";
import { DomainEventPublisher } from "./domain-event-publisher";
import { registerDomainNotificationHandlers } from "@/notifications/integrations/handlers/domain-notification.handlers";
import { registerWebhookDomainEventHandlers } from "@/webhooks/integrations/register-webhook-handlers";

const dispatcher = new InMemoryDomainEventDispatcher();
const domainEventPublisher = new DomainEventPublisher({ dispatcher });

registerDomainNotificationHandlers(dispatcher);
registerWebhookDomainEventHandlers(dispatcher);

export function getDomainEventDispatcher(): InMemoryDomainEventDispatcher {
  return dispatcher;
}

export function getDomainEventPublisher(): DomainEventPublisher {
  return domainEventPublisher;
}

export { DomainEventPublisher } from "./domain-event-publisher";
export {
  buildCartCreatedEvent,
  buildCartItemAddedEvent,
  buildCartItemRemovedEvent,
  buildCartItemUpdatedEvent,
  buildCheckoutCompletedEvent,
  buildCustomerAddressCreatedEvent,
  buildCustomerAddressUpdatedEvent,
  buildProductMediaUploadedEvent,
  buildProductMediaDeletedEvent,
  buildProductMediaReorderedEvent,
  buildCustomerCreatedEvent,
  buildCustomerUpdatedEvent,
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
