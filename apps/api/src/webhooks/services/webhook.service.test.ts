import { describe, expect, it, vi } from "vitest";

import { createDomainEvent } from "@/domain-events/domain-event-factory";
import { WEBHOOK_ERROR_CODES } from "../errors";
import {
  buildWebhookSignatureHeader,
  signWebhookPayload,
  verifyWebhookSignature,
} from "../services/signature.service";
import {
  createMemoryWebhookModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCreateWebhookInput,
} from "../testing/webhook-test-utils";

describe("SignatureService", () => {
  it("generates verifiable HMAC-SHA256 signatures with timestamp", () => {
    const secret = "whsec_test_secret";
    const timestamp = "2026-07-17T12:00:00.000Z";
    const payload = JSON.stringify({ eventType: "order.confirmed" });

    const headers = signWebhookPayload(secret, timestamp, payload);
    const headerValue = buildWebhookSignatureHeader(headers);

    expect(headerValue).toContain(`t=${timestamp}`);
    expect(
      verifyWebhookSignature(secret, timestamp, payload, headers.signature),
    ).toBe(true);
  });
});

describe("WebhookService", () => {
  it("creates a webhook endpoint and returns the secret only once", async () => {
    const module = createMemoryWebhookModule();

    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    expect(webhook.secret).toBeTruthy();
    expect(webhook.url).toBe("https://example.com/webhooks/commerceflow");

    const listed = await module.webhookService.listWebhooks({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(listed.items[0]).not.toHaveProperty("secret");
  });

  it("updates webhook enablement", async () => {
    const module = createMemoryWebhookModule();
    const created = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    const updated = await module.webhookService.updateWebhook(
      TEST_STORE_A_ID,
      created.id,
      { enabled: false },
    );

    expect(updated.enabled).toBe(false);
  });

  it("isolates webhooks by store", async () => {
    const module = createMemoryWebhookModule();
    const storeBWebhook = await module.webhookService.createWebhook(
      validCreateWebhookInput({ storeId: TEST_STORE_B_ID }),
    );

    await expect(
      module.webhookService.getWebhook(TEST_STORE_A_ID, storeBWebhook.id),
    ).rejects.toMatchObject({
      code: WEBHOOK_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});

describe("WebhookDeliveryService", () => {
  it("delivers signed payloads and records successful delivery", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response("ok", { status: 200 }),
    );
    const module = createMemoryWebhookModule({ fetchImpl });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    const endpoint = await module.webhookRepository.findEndpointWithSecret(
      TEST_STORE_A_ID,
      webhook.id,
    );

    expect(endpoint).not.toBeNull();

    const delivery = await module.webhookDeliveryService.deliverToEndpoint(
      endpoint!,
      "order.confirmed",
      { orderId: "order-1" },
    );

    expect(delivery?.status).toBe("delivered");
    expect(delivery?.responseStatus).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();

    const [, requestInit] = fetchImpl.mock.calls[0]!;
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers["x-webhook-signature"]).toContain("v1=");
    expect(headers["x-webhook-timestamp"]).toBeTruthy();
  });

  it("records failed delivery for non-2xx responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response("error", { status: 500 }),
    );
    const module = createMemoryWebhookModule({ fetchImpl });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );
    const endpoint = await module.webhookRepository.findEndpointWithSecret(
      TEST_STORE_A_ID,
      webhook.id,
    );

    const delivery = await module.webhookDeliveryService.deliverToEndpoint(
      endpoint!,
      "order.confirmed",
      { orderId: "order-1" },
    );

    expect(delivery?.status).toBe("failed");
    expect(delivery?.responseStatus).toBe(500);
  });

  it("skips disabled endpoints during domain event delivery", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));
    const module = createMemoryWebhookModule({ fetchImpl });
    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput({ enabled: false }),
    );

    await module.webhookDeliveryService.deliverDomainEvent(
      createDomainEvent({
        eventType: "order.confirmed",
        aggregateType: "order",
        aggregateId: "order-1",
        storeId: TEST_STORE_A_ID,
        payload: { orderId: "order-1" },
      }),
    );

    expect(fetchImpl).not.toHaveBeenCalled();

    const deliveries = await module.webhookService.listDeliveries(
      TEST_STORE_A_ID,
      webhook.id,
      { storeId: TEST_STORE_A_ID, page: 1, limit: 20 },
    );

    expect(deliveries.items).toHaveLength(0);
  });
});
