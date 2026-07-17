import type { DomainEvent } from "@commerceflow/types";
import {
  WEBHOOK_SUBSCRIBABLE_EVENT_TYPES,
  type WebhookSubscribableEventType,
} from "@commerceflow/types";

import { auditService, type AuditService } from "@/audit/services";
import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID,
  DOMAIN_NOTIFICATION_SYSTEM_USER_ID,
} from "@/notifications/integrations/services/domain-notification.service";
import type { WebhookEndpointRecord } from "../repositories/webhook.repository";
import { getWebhookRepository, type WebhookRepository } from "../repositories";
import {
  buildWebhookSignatureHeader,
  signWebhookPayload,
} from "./signature.service";

export interface WebhookDeliveryResult {
  readonly responseStatus: number;
  readonly success: boolean;
}

export interface WebhookDeliveryServiceDependencies {
  readonly webhookRepository?: WebhookRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
  readonly fetchImpl?: typeof fetch;
  readonly auditService?: AuditService;
}

export class WebhookDeliveryService {
  private readonly webhookRepository: WebhookRepository;
  private readonly domainEventPublisher: DomainEventPublisher;
  private readonly fetchImpl: typeof fetch;
  private readonly auditService: AuditService;

  constructor(dependencies: WebhookDeliveryServiceDependencies = {}) {
    this.webhookRepository =
      dependencies.webhookRepository ?? getWebhookRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.auditService = dependencies.auditService ?? auditService;
  }

  async deliverDomainEvent(event: DomainEvent): Promise<void> {
    if (!event.storeId) {
      return;
    }

    if (
      !this.isSubscribableEventType(event.eventType)
    ) {
      return;
    }

    const endpoints = await this.webhookRepository.findEnabledEndpointsForEvent(
      event.storeId,
      event.eventType,
    );

    const payload = {
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      storeId: event.storeId,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    };

    for (const endpoint of endpoints) {
      await this.deliverToEndpoint(endpoint, event.eventType, payload);
    }
  }

  async deliverToEndpoint(
    endpoint: WebhookEndpointRecord,
    eventType: string,
    payload: unknown,
  ) {
    if (!endpoint.enabled) {
      return null;
    }

    const delivery = await this.webhookRepository.createDelivery(
      endpoint.id,
      eventType,
    );

    const body = JSON.stringify(payload);
    const timestamp = new Date().toISOString();
    const signatureHeaders = signWebhookPayload(
      endpoint.secret,
      timestamp,
      body,
    );

    try {
      const response = await this.fetchImpl(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-timestamp": signatureHeaders.timestamp,
          "x-webhook-signature": buildWebhookSignatureHeader(signatureHeaders),
        },
        body,
      });

      const deliveredAt = new Date().toISOString();
      const success = response.ok;

      const updated = success
        ? await this.webhookRepository.markDeliveryDelivered(
            delivery.id,
            response.status,
            deliveredAt,
          )
        : await this.webhookRepository.markDeliveryFailed(
            delivery.id,
            response.status,
            deliveredAt,
          );

      if (success) {
        this.domainEventPublisher.publishWebhookDeliveryCompleted(
          endpoint,
          updated,
        );
      } else {
        this.domainEventPublisher.publishWebhookDeliveryFailed(
          endpoint,
          updated,
        );
      }

      this.recordDeliveryAudit(endpoint, updated);

      return updated;
    } catch {
      const deliveredAt = new Date().toISOString();
      const failed = await this.webhookRepository.markDeliveryFailed(
        delivery.id,
        undefined,
        deliveredAt,
      );

      this.domainEventPublisher.publishWebhookDeliveryFailed(endpoint, failed);
      this.recordDeliveryAudit(endpoint, failed);
      return failed;
    }
  }

  private recordDeliveryAudit(
    endpoint: WebhookEndpointRecord,
    delivery: {
      id: string;
      eventType: string;
      status: string;
      responseStatus?: number;
    },
  ): void {
    this.auditService.recordBestEffort({
      storeId: endpoint.storeId,
      userId: DOMAIN_NOTIFICATION_SYSTEM_USER_ID,
      sessionId: DOMAIN_NOTIFICATION_SYSTEM_SESSION_ID,
      entityType: "webhook",
      entityId: endpoint.id,
      action: "deliver",
      metadata: {
        webhookId: endpoint.id,
        deliveryId: delivery.id,
        eventType: delivery.eventType,
        status: delivery.status,
        responseStatus: delivery.responseStatus,
      },
    });
  }

  private isSubscribableEventType(
    eventType: string,
  ): eventType is WebhookSubscribableEventType {
    return (WEBHOOK_SUBSCRIBABLE_EVENT_TYPES as readonly string[]).includes(
      eventType,
    );
  }
}

let webhookDeliveryServiceInstance: WebhookDeliveryService | undefined;

export function getWebhookDeliveryService(): WebhookDeliveryService {
  if (!webhookDeliveryServiceInstance) {
    webhookDeliveryServiceInstance = new WebhookDeliveryService();
  }

  return webhookDeliveryServiceInstance;
}
