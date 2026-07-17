import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryDisasterReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/disaster-readiness-test-utils";

describe("RecoveryPlanService domain events", () => {
  it("emits platform.recovery-objectives.updated on update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.recovery-objectives.updated", handler);

    const module = createMemoryDisasterReadinessModule({
      domainEventPublisher: publisher,
    });

    const recoveryObjectives =
      await module.disasterReadinessFacade.updateRecoveryObjectives({
        storeId: TEST_STORE_A_ID,
        rpoMinutes: 30,
        rtoMinutes: 90,
      });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.recovery-objectives.updated",
      aggregateType: "platform",
      storeId: TEST_STORE_A_ID,
      payload: {
        rpoMinutes: 30,
        rtoMinutes: 90,
        recoveryObjectives,
      },
    });
  });
});
