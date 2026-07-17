import {
  buildCatalogueListResult,
  type WebhookDelivery,
  type WebhookEndpoint,
} from "@commerceflow/types";
import type {
  CreateWebhookInput,
  ListWebhookDeliveriesQuery,
  ListWebhooksQuery,
  UpdateWebhookInput,
} from "@commerceflow/validation";

import type { WebhookEndpointRecord, WebhookRepository } from "./webhook.repository";

export class MemoryWebhookRepository implements WebhookRepository {
  private readonly endpointsById = new Map<string, WebhookEndpointRecord>();
  private readonly deliveriesById = new Map<string, WebhookDelivery>();

  async findEndpointById(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpoint | null> {
    const record = this.endpointsById.get(id);
    return record?.storeId === storeId ? this.toPublic(record) : null;
  }

  async findEndpointWithSecret(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpointRecord | null> {
    const record = this.endpointsById.get(id);
    return record?.storeId === storeId ? record : null;
  }

  async findEnabledEndpointsForEvent(storeId: string, eventType: string) {
    return [...this.endpointsById.values()].filter(
      (record) =>
        record.storeId === storeId &&
        record.enabled &&
        record.subscribedEvents.includes(
          eventType as WebhookEndpointRecord["subscribedEvents"][number],
        ),
    );
  }

  async listEndpoints(query: ListWebhooksQuery) {
    const items = [...this.endpointsById.values()]
      .filter((record) => record.storeId === query.storeId)
      .sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          left.id.localeCompare(right.id),
      )
      .map((record) => this.toPublic(record));

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createEndpoint(
    input: CreateWebhookInput,
    secret: string,
  ): Promise<WebhookEndpoint> {
    const now = new Date().toISOString();
    const record: WebhookEndpointRecord = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      url: input.url,
      secret,
      enabled: input.enabled,
      subscribedEvents: input.subscribedEvents,
      createdAt: now,
      updatedAt: now,
    };

    this.endpointsById.set(record.id, record);
    return this.toPublic(record);
  }

  async updateEndpoint(
    storeId: string,
    id: string,
    input: UpdateWebhookInput,
  ): Promise<WebhookEndpoint> {
    const existing = this.endpointsById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Webhook endpoint not found: ${id}`);
    }

    const updated: WebhookEndpointRecord = {
      ...existing,
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.subscribedEvents !== undefined
        ? { subscribedEvents: input.subscribedEvents }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    this.endpointsById.set(id, updated);
    return this.toPublic(updated);
  }

  async createDelivery(
    endpointId: string,
    eventType: string,
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      endpointId,
      eventType,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.deliveriesById.set(delivery.id, delivery);
    return delivery;
  }

  async markDeliveryDelivered(
    deliveryId: string,
    responseStatus: number,
    deliveredAt: string,
  ): Promise<WebhookDelivery> {
    const existing = this.deliveriesById.get(deliveryId);

    if (!existing) {
      throw new Error(`Webhook delivery not found: ${deliveryId}`);
    }

    const updated: WebhookDelivery = {
      ...existing,
      status: "delivered",
      responseStatus,
      deliveredAt,
    };

    this.deliveriesById.set(deliveryId, updated);
    return updated;
  }

  async markDeliveryFailed(
    deliveryId: string,
    responseStatus: number | undefined,
    deliveredAt: string,
  ): Promise<WebhookDelivery> {
    const existing = this.deliveriesById.get(deliveryId);

    if (!existing) {
      throw new Error(`Webhook delivery not found: ${deliveryId}`);
    }

    const updated: WebhookDelivery = {
      ...existing,
      status: "failed",
      responseStatus,
      deliveredAt,
    };

    this.deliveriesById.set(deliveryId, updated);
    return updated;
  }

  async listDeliveries(
    storeId: string,
    endpointId: string,
    query: ListWebhookDeliveriesQuery,
  ) {
    const endpoint = await this.findEndpointById(storeId, endpointId);

    if (!endpoint) {
      throw new Error(`Webhook endpoint not found: ${endpointId}`);
    }

    const items = [...this.deliveriesById.values()]
      .filter((delivery) => delivery.endpointId === endpointId)
      .sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          left.id.localeCompare(right.id),
      );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  private toPublic(record: WebhookEndpointRecord): WebhookEndpoint {
    return {
      id: record.id,
      storeId: record.storeId,
      url: record.url,
      enabled: record.enabled,
      subscribedEvents: record.subscribedEvents,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
