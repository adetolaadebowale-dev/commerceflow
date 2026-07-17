import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryApiKeyModule,
  validCreateApiKeyInput,
} from "../testing/api-key-test-utils";

describe("ApiKeyService domain events", () => {
  it("emits api-key.created when a key is created", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("api-key.created", handler);

    const module = createMemoryApiKeyModule({ domainEventPublisher: publisher });
    const apiKey = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "api-key.created",
      aggregateType: "api_key",
      aggregateId: apiKey.id,
      payload: {
        apiKeyId: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
      },
    });
  });

  it("emits api-key.revoked when a key is revoked", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("api-key.revoked", handler);

    const module = createMemoryApiKeyModule({ domainEventPublisher: publisher });
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    await module.apiKeyService.revokeApiKey(created.storeId, created.id);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "api-key.revoked",
      aggregateId: created.id,
    });
  });
});
