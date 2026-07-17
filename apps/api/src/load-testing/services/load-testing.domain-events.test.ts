import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryLoadTestingModule,
  TEST_STORE_A_ID,
} from "../testing/load-testing-test-utils";

describe("LoadTestingService domain events", () => {
  it("emits platform.load-testing.updated on configuration update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.load-testing.updated", handler);

    const module = createMemoryLoadTestingModule({
      domainEventPublisher: publisher,
    });

    const configuration = await module.loadTestingService.updateConfiguration({
      storeId: TEST_STORE_A_ID,
      enabled: true,
      preferredTool: "jmeter",
      targetVirtualUsers: 75,
      durationSeconds: 180,
      rampUpSeconds: 30,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.load-testing.updated",
      aggregateType: "platform",
      storeId: TEST_STORE_A_ID,
      payload: {
        enabled: true,
        preferredTool: "jmeter",
        targetVirtualUsers: 75,
        configuration,
      },
    });
  });
});
