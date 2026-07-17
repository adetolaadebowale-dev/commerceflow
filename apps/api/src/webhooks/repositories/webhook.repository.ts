import type {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookSubscribableEventType,
} from "@commerceflow/types";
import type {
  CreateWebhookInput,
  ListWebhookDeliveriesQuery,
  ListWebhooksQuery,
  UpdateWebhookInput,
} from "@commerceflow/validation";

export interface WebhookEndpointRecord extends WebhookEndpoint {
  readonly secret: string;
}

export interface WebhookRepository {
  findEndpointById(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpoint | null>;
  findEndpointWithSecret(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpointRecord | null>;
  findEnabledEndpointsForEvent(
    storeId: string,
    eventType: WebhookSubscribableEventType,
  ): Promise<readonly WebhookEndpointRecord[]>;
  listEndpoints(query: ListWebhooksQuery): Promise<{
    items: readonly WebhookEndpoint[];
    total: number;
    page: number;
    limit: number;
  }>;
  createEndpoint(
    input: CreateWebhookInput,
    secret: string,
  ): Promise<WebhookEndpoint>;
  updateEndpoint(
    storeId: string,
    id: string,
    input: UpdateWebhookInput,
  ): Promise<WebhookEndpoint>;
  createDelivery(
    endpointId: string,
    eventType: string,
  ): Promise<WebhookDelivery>;
  markDeliveryDelivered(
    deliveryId: string,
    responseStatus: number,
    deliveredAt: string,
  ): Promise<WebhookDelivery>;
  markDeliveryFailed(
    deliveryId: string,
    responseStatus: number | undefined,
    deliveredAt: string,
  ): Promise<WebhookDelivery>;
  listDeliveries(
    storeId: string,
    endpointId: string,
    query: ListWebhookDeliveriesQuery,
  ): Promise<{
    items: readonly WebhookDelivery[];
    total: number;
    page: number;
    limit: number;
  }>;
}

export function toSubscribedEvents(
  value: unknown,
): WebhookSubscribableEventType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (event): event is WebhookSubscribableEventType => typeof event === "string",
  );
}
