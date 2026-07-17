import type { DomainEventType } from "../domain-events/domain-event-type";

/** Domain event types that webhook endpoints may subscribe to. */
export const WEBHOOK_SUBSCRIBABLE_EVENT_TYPES = [
  "order.confirmed",
  "order.cancelled",
  "order.fulfilled",
  "customer.created",
  "customer.updated",
  "payment.paid",
  "payment.failed",
  "inventory.reserved",
  "inventory.released",
  "import.completed",
  "import.failed",
  "export.completed",
  "export.failed",
  "api-key.created",
  "api-key.revoked",
  "store.settings.updated",
] as const satisfies readonly DomainEventType[];

export type WebhookSubscribableEventType =
  (typeof WEBHOOK_SUBSCRIBABLE_EVENT_TYPES)[number];

/** Webhook delivery lifecycle statuses. */
export const WEBHOOK_DELIVERY_STATUSES = [
  "pending",
  "delivered",
  "failed",
] as const;

export type WebhookDeliveryStatus =
  (typeof WEBHOOK_DELIVERY_STATUSES)[number];

/** Store-scoped webhook endpoint (secret never exposed). */
export interface WebhookEndpoint {
  readonly id: string;
  readonly storeId: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly subscribedEvents: readonly WebhookSubscribableEventType[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Webhook endpoint returned once at creation with the signing secret. */
export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  readonly secret: string;
}

/** Record of a synchronous webhook delivery attempt. */
export interface WebhookDelivery {
  readonly id: string;
  readonly endpointId: string;
  readonly eventType: string;
  readonly status: WebhookDeliveryStatus;
  readonly responseStatus?: number;
  readonly deliveredAt?: string;
  readonly createdAt: string;
}

/** Signed webhook HTTP headers. */
export interface WebhookSignatureHeaders {
  readonly timestamp: string;
  readonly signature: string;
}
