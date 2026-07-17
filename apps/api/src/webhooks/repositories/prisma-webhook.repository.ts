import {
  Prisma,
  type PrismaClient,
  type WebhookEndpoint as PrismaWebhookEndpoint,
  type WebhookDelivery as PrismaWebhookDelivery,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookSubscribableEventType,
} from "@commerceflow/types";
import type {
  CreateWebhookInput,
  ListWebhookDeliveriesQuery,
  ListWebhooksQuery,
  UpdateWebhookInput,
} from "@commerceflow/validation";

import type { WebhookEndpointRecord, WebhookRepository } from "./webhook.repository";
import { toSubscribedEvents } from "./webhook.repository";

function toWebhookEndpoint(record: PrismaWebhookEndpoint): WebhookEndpoint {
  return {
    id: record.id,
    storeId: record.storeId,
    url: record.url,
    enabled: record.enabled,
    subscribedEvents: toSubscribedEvents(record.subscribedEvents),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toWebhookEndpointRecord(
  record: PrismaWebhookEndpoint,
): WebhookEndpointRecord {
  return {
    ...toWebhookEndpoint(record),
    secret: record.secret,
  };
}

function toWebhookDelivery(record: PrismaWebhookDelivery): WebhookDelivery {
  return {
    id: record.id,
    endpointId: record.endpointId,
    eventType: record.eventType,
    status: record.status,
    responseStatus: record.responseStatus ?? undefined,
    deliveredAt: record.deliveredAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

export class PrismaWebhookRepository implements WebhookRepository {
  constructor(private readonly db: PrismaClient) {}

  async findEndpointById(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpoint | null> {
    const record = await this.db.webhookEndpoint.findFirst({
      where: { id, storeId },
    });

    return record ? toWebhookEndpoint(record) : null;
  }

  async findEndpointWithSecret(
    storeId: string,
    id: string,
  ): Promise<WebhookEndpointRecord | null> {
    const record = await this.db.webhookEndpoint.findFirst({
      where: { id, storeId },
    });

    return record ? toWebhookEndpointRecord(record) : null;
  }

  async findEnabledEndpointsForEvent(
    storeId: string,
    eventType: WebhookSubscribableEventType,
  ): Promise<readonly WebhookEndpointRecord[]> {
    const records = await this.db.webhookEndpoint.findMany({
      where: {
        storeId,
        enabled: true,
      },
    });

    return records
      .map(toWebhookEndpointRecord)
      .filter((record) => record.subscribedEvents.includes(eventType));
  }

  async listEndpoints(query: ListWebhooksQuery) {
    const where = { storeId: query.storeId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.webhookEndpoint.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.webhookEndpoint.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toWebhookEndpoint),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createEndpoint(
    input: CreateWebhookInput,
    secret: string,
  ): Promise<WebhookEndpoint> {
    const record = await this.db.webhookEndpoint.create({
      data: {
        storeId: input.storeId,
        url: input.url,
        secret,
        enabled: input.enabled,
        subscribedEvents:
          input.subscribedEvents as unknown as Prisma.InputJsonValue,
      },
    });

    return toWebhookEndpoint(record);
  }

  async updateEndpoint(
    storeId: string,
    id: string,
    input: UpdateWebhookInput,
  ): Promise<WebhookEndpoint> {
    const result = await this.db.webhookEndpoint.updateMany({
      where: { id, storeId },
      data: {
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.subscribedEvents !== undefined
          ? {
              subscribedEvents:
                input.subscribedEvents as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Webhook endpoint not found: ${id}`);
    }

    const record = await this.db.webhookEndpoint.findFirstOrThrow({
      where: { id, storeId },
    });

    return toWebhookEndpoint(record);
  }

  async createDelivery(
    endpointId: string,
    eventType: string,
  ): Promise<WebhookDelivery> {
    const record = await this.db.webhookDelivery.create({
      data: {
        endpointId,
        eventType,
        status: "pending",
      },
    });

    return toWebhookDelivery(record);
  }

  async markDeliveryDelivered(
    deliveryId: string,
    responseStatus: number,
    deliveredAt: string,
  ): Promise<WebhookDelivery> {
    const record = await this.db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "delivered",
        responseStatus,
        deliveredAt: new Date(deliveredAt),
      },
    });

    return toWebhookDelivery(record);
  }

  async markDeliveryFailed(
    deliveryId: string,
    responseStatus: number | undefined,
    deliveredAt: string,
  ): Promise<WebhookDelivery> {
    const record = await this.db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "failed",
        responseStatus: responseStatus ?? null,
        deliveredAt: new Date(deliveredAt),
      },
    });

    return toWebhookDelivery(record);
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

    const where = { endpointId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.webhookDelivery.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.webhookDelivery.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toWebhookDelivery),
      total,
      page: query.page,
      limit: query.limit,
    });
  }
}
