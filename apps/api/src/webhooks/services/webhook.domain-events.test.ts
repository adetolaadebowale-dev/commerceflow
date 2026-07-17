import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryWebhookModule,
  validCreateWebhookInput,
} from "../testing/webhook-test-utils";

describe("WebhookService domain events", () => {
  it("emits webhook.created when an endpoint is registered", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("webhook.created", handler);

    const module = createMemoryWebhookModule({ domainEventPublisher: publisher });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "webhook.created",
      aggregateId: webhook.id,
    });
  });

  it("emits webhook.updated when an endpoint is patched", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("webhook.updated", handler);

    const module = createMemoryWebhookModule({ domainEventPublisher: publisher });
    const created = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    await module.webhookService.updateWebhook(created.storeId, created.id, {
      enabled: false,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "webhook.updated",
      aggregateId: created.id,
    });
  });
});
