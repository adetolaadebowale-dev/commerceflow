import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPlatformHardeningModule,
  TEST_STORE_A_ID,
} from "../testing/platform-hardening-test-utils";

describe("CachePolicyService domain events", () => {
  it("emits platform.cache-policy.updated on policy upsert", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.cache-policy.updated", handler);

    const module = createMemoryPlatformHardeningModule({
      domainEventPublisher: publisher,
    });

    const cachePolicy = await module.platformHardeningFacade.updateCachePolicy({
      storeId: TEST_STORE_A_ID,
      resource: "catalogue.categories",
      enabled: true,
      ttlSeconds: 90,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.cache-policy.updated",
      aggregateType: "platform",
      aggregateId: "catalogue.categories",
      storeId: TEST_STORE_A_ID,
      payload: {
        resource: "catalogue.categories",
        enabled: true,
        ttlSeconds: 90,
        cachePolicy,
      },
    });
  });
});
