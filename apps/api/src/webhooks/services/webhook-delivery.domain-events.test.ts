import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryWebhookModule,
  validCreateWebhookInput,
} from "../testing/webhook-test-utils";

describe("WebhookDeliveryService domain events", () => {
  it("emits webhook.delivery.completed on successful delivery", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("webhook.delivery.completed", handler);

    const module = createMemoryWebhookModule({
      domainEventPublisher: publisher,
      fetchImpl,
    });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );
    const endpoint = await module.webhookRepository.findEndpointWithSecret(
      webhook.storeId,
      webhook.id,
    );

    await module.webhookDeliveryService.deliverToEndpoint(
      endpoint!,
      "order.confirmed",
      { orderId: "order-1" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "webhook.delivery.completed",
      aggregateType: "webhook_delivery",
    });
  });

  it("emits webhook.delivery.failed on failed delivery", async () => {
    const fetchImpl = vi.fn(async () => new Response("error", { status: 502 }));
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("webhook.delivery.failed", handler);

    const module = createMemoryWebhookModule({
      domainEventPublisher: publisher,
      fetchImpl,
    });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );
    const endpoint = await module.webhookRepository.findEndpointWithSecret(
      webhook.storeId,
      webhook.id,
    );

    await module.webhookDeliveryService.deliverToEndpoint(
      endpoint!,
      "order.confirmed",
      { orderId: "order-1" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "webhook.delivery.failed",
    });
  });
});
