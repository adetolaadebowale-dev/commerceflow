import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryFeatureFlagModule,
  TEST_STORE_A_ID,
  validUpsertInput,
} from "../testing/feature-flag-test-utils";

describe("FeatureFlagService domain events", () => {
  it("emits feature-flag.updated on upsert", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("feature-flag.updated", handler);

    const { featureFlagService } = createMemoryFeatureFlagModule({
      domainEventPublisher: publisher,
    });

    const featureFlag = await featureFlagService.upsertFeatureFlag(
      "beta-ui",
      validUpsertInput({ enabled: true }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "feature-flag.updated",
      aggregateType: "feature_flag",
      aggregateId: featureFlag.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        featureFlagId: featureFlag.id,
        key: "beta-ui",
        scope: "store",
        enabled: true,
      },
    });
  });

  it("emits feature-flag.updated again when an existing flag is updated", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("feature-flag.updated", handler);

    const { featureFlagService } = createMemoryFeatureFlagModule({
      domainEventPublisher: publisher,
    });

    await featureFlagService.upsertFeatureFlag(
      "beta-ui",
      validUpsertInput({ enabled: false }),
    );
    await featureFlagService.upsertFeatureFlag(
      "beta-ui",
      validUpsertInput({ enabled: true }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(2);
    });

    expect(handler.mock.calls[1]?.[0]).toMatchObject({
      eventType: "feature-flag.updated",
      payload: {
        key: "beta-ui",
        enabled: true,
      },
    });
  });
});
