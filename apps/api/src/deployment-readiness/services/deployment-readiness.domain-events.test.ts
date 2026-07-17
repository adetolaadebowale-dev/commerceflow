import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryDeploymentReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/deployment-readiness-test-utils";

describe("DeploymentReadinessService domain events", () => {
  it("emits platform.deployment-configuration.updated on update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.deployment-configuration.updated", handler);

    const module = createMemoryDeploymentReadinessModule({
      domainEventPublisher: publisher,
    });

    const configuration =
      await module.deploymentReadinessService.updateConfiguration({
        storeId: TEST_STORE_A_ID,
        target: "staging",
        requireHttps: true,
        requireMigrationsApplied: true,
        minimumNodeVersion: "20",
        releaseChannel: "beta",
      });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.deployment-configuration.updated",
      aggregateType: "platform",
      storeId: TEST_STORE_A_ID,
      payload: {
        target: "staging",
        releaseChannel: "beta",
        configuration,
      },
    });
  });
});
