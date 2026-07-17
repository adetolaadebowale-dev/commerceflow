import type { CreateWebhookInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import type { AuditService } from "@/audit/services";
import { MemoryWebhookRepository } from "../repositories/memory-webhook.repository";
import { WebhookDeliveryService } from "../services/webhook-delivery.service";
import { WebhookService } from "../services/webhook.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryWebhookModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  fetchImpl?: typeof fetch;
  auditService?: AuditService;
} = {}) {
  const webhookRepository = new MemoryWebhookRepository();

  return {
    webhookRepository,
    webhookService: new WebhookService({
      webhookRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
    webhookDeliveryService: new WebhookDeliveryService({
      webhookRepository,
      domainEventPublisher: options.domainEventPublisher,
      fetchImpl: options.fetchImpl,
      auditService: options.auditService,
    }),
  };
}

export function validCreateWebhookInput(
  overrides: Partial<CreateWebhookInput> = {},
): CreateWebhookInput {
  return {
    storeId: TEST_STORE_A_ID,
    url: "https://example.com/webhooks/commerceflow",
    enabled: true,
    subscribedEvents: ["order.confirmed"],
    ...overrides,
  };
}
