import { WEBHOOK_SUBSCRIBABLE_EVENT_TYPES } from "@commerceflow/types";

import type { DomainEventDispatcher } from "@/domain-events/dispatcher";
import type { WebhookDeliveryService } from "../services/webhook-delivery.service";

export function registerWebhookDomainEventHandlers(
  dispatcher: DomainEventDispatcher,
  service?: WebhookDeliveryService,
): void {
  for (const eventType of WEBHOOK_SUBSCRIBABLE_EVENT_TYPES) {
    dispatcher.subscribe(eventType, async (event) => {
      try {
        const deliveryService =
          service ??
          (
            await import("../services/webhook-delivery.service")
          ).getWebhookDeliveryService();

        await deliveryService.deliverDomainEvent(event);
      } catch (error) {
        console.error("Failed to deliver webhook for domain event", {
          eventType: event.eventType,
          error,
        });
      }
    });
  }
}
