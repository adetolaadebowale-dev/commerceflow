import type {
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  WebhookSubscribableEventType,
} from "@commerceflow/types";
import type {
  CreateWebhookInput,
  ListWebhookDeliveriesQuery,
  ListWebhooksQuery,
  UpdateWebhookInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { WEBHOOK_ERROR_CODES, WebhookError } from "../errors";
import { getWebhookRepository, type WebhookRepository } from "../repositories";
import { generateWebhookSecret } from "./signature.service";

export interface WebhookServiceDependencies {
  readonly webhookRepository?: WebhookRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class WebhookService {
  private readonly webhookRepository: WebhookRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: WebhookServiceDependencies = {}) {
    this.webhookRepository =
      dependencies.webhookRepository ?? getWebhookRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createWebhook(input: CreateWebhookInput): Promise<WebhookEndpointWithSecret> {
    const secret = generateWebhookSecret();

    let webhook: WebhookEndpoint;

    try {
      webhook = await this.webhookRepository.createEndpoint(input, secret);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishWebhookCreated(webhook);

    return {
      ...webhook,
      secret,
    };
  }

  async getWebhook(storeId: string, id: string): Promise<WebhookEndpoint> {
    const webhook = await this.webhookRepository.findEndpointById(storeId, id);

    if (!webhook) {
      throw new WebhookError(
        WEBHOOK_ERROR_CODES.NOT_FOUND,
        "Webhook endpoint not found",
        404,
      );
    }

    return webhook;
  }

  async listWebhooks(query: ListWebhooksQuery) {
    return this.webhookRepository.listEndpoints(query);
  }

  async updateWebhook(
    storeId: string,
    id: string,
    input: UpdateWebhookInput,
  ): Promise<WebhookEndpoint> {
    await this.getWebhook(storeId, id);

    let webhook: WebhookEndpoint;

    try {
      webhook = await this.webhookRepository.updateEndpoint(storeId, id, input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishWebhookUpdated(webhook);
    return webhook;
  }

  async listDeliveries(
    storeId: string,
    endpointId: string,
    query: ListWebhookDeliveriesQuery,
  ) {
    await this.getWebhook(storeId, endpointId);

    try {
      return await this.webhookRepository.listDeliveries(
        storeId,
        endpointId,
        query,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async findEnabledEndpointsForEvent(
    storeId: string,
    eventType: WebhookSubscribableEventType,
  ) {
    return this.webhookRepository.findEnabledEndpointsForEvent(
      storeId,
      eventType,
    );
  }

  private mapRepositoryError(error: unknown): WebhookError {
    if (error instanceof WebhookError) {
      return error;
    }

    return new WebhookError(
      WEBHOOK_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "Webhook repository error",
      500,
    );
  }
}

export const webhookService = new WebhookService();
