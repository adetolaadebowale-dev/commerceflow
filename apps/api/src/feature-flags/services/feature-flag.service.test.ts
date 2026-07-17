import { describe, expect, it } from "vitest";

import { FEATURE_FLAG_ERROR_CODES } from "../errors";
import {
  createMemoryFeatureFlagModule,
  TEST_STORE_A_ID,
  TEST_STORE_A2_ID,
  TEST_STORE_B_ID,
  validUpsertInput,
} from "../testing/feature-flag-test-utils";

describe("FeatureFlagService", () => {
  it("resolves effective flags with store over organization over platform precedence", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    await featureFlagService.upsertFeatureFlag(
      "new-checkout",
      validUpsertInput({ scope: "platform", enabled: false }),
    );
    await featureFlagService.upsertFeatureFlag(
      "new-checkout",
      validUpsertInput({ scope: "organization", enabled: true }),
    );

    const beforeStoreOverride =
      await featureFlagService.getEffectiveFeatureFlags({
        storeId: TEST_STORE_A_ID,
        keys: ["new-checkout"],
      });

    expect(beforeStoreOverride.items[0]).toMatchObject({
      key: "new-checkout",
      enabled: true,
      source: "organization",
    });

    await featureFlagService.upsertFeatureFlag(
      "new-checkout",
      validUpsertInput({ scope: "store", enabled: false }),
    );

    const afterStoreOverride = await featureFlagService.getEffectiveFeatureFlags(
      {
        storeId: TEST_STORE_A_ID,
        keys: ["new-checkout"],
      },
    );

    expect(afterStoreOverride.items[0]).toMatchObject({
      key: "new-checkout",
      enabled: false,
      source: "store",
    });
  });

  it("defaults unknown keys to disabled with default source", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    const result = await featureFlagService.getEffectiveFeatureFlags({
      storeId: TEST_STORE_A_ID,
      keys: ["missing-flag"],
    });

    expect(result.items).toEqual([
      {
        key: "missing-flag",
        enabled: false,
        source: "default",
      },
    ]);
  });

  it("creates and updates feature flags for a scope/key combination", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    const created = await featureFlagService.upsertFeatureFlag(
      "analytics-v2",
      validUpsertInput({ enabled: false, description: "Initial" }),
    );

    expect(created).toMatchObject({
      key: "analytics-v2",
      scope: "store",
      enabled: false,
      description: "Initial",
      storeId: TEST_STORE_A_ID,
    });

    const updated = await featureFlagService.upsertFeatureFlag(
      "analytics-v2",
      validUpsertInput({ enabled: true, description: "Updated" }),
    );

    expect(updated.id).toBe(created.id);
    expect(updated.enabled).toBe(true);
    expect(updated.description).toBe("Updated");
    expect(updated.createdAt).toBe(created.createdAt);
  });

  it("lists flags visible to the store context across scopes", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    await featureFlagService.upsertFeatureFlag(
      "platform-only",
      validUpsertInput({ scope: "platform", enabled: true }),
    );
    await featureFlagService.upsertFeatureFlag(
      "org-only",
      validUpsertInput({ scope: "organization", enabled: true }),
    );
    await featureFlagService.upsertFeatureFlag(
      "store-only",
      validUpsertInput({ scope: "store", enabled: true }),
    );

    const listed = await featureFlagService.listFeatureFlags({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(listed.total).toBe(3);
    expect(listed.items.map((flag) => flag.key).sort()).toEqual([
      "org-only",
      "platform-only",
      "store-only",
    ]);
  });

  it("isolates organization and store flags across tenants", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    await featureFlagService.upsertFeatureFlag(
      "tenant-flag",
      validUpsertInput({
        storeId: TEST_STORE_A_ID,
        scope: "organization",
        enabled: true,
      }),
    );
    await featureFlagService.upsertFeatureFlag(
      "tenant-flag",
      validUpsertInput({
        storeId: TEST_STORE_A_ID,
        scope: "store",
        enabled: true,
      }),
    );

    const storeBList = await featureFlagService.listFeatureFlags({
      storeId: TEST_STORE_B_ID,
      page: 1,
      limit: 20,
    });

    expect(storeBList.items).toEqual([]);

    const storeA2List = await featureFlagService.listFeatureFlags({
      storeId: TEST_STORE_A2_ID,
      page: 1,
      limit: 20,
    });

    expect(storeA2List.items).toHaveLength(1);
    expect(storeA2List.items[0]).toMatchObject({
      key: "tenant-flag",
      scope: "organization",
    });

    const storeA2Effective = await featureFlagService.getEffectiveFeatureFlags({
      storeId: TEST_STORE_A2_ID,
      keys: ["tenant-flag"],
    });

    expect(storeA2Effective.items[0]).toMatchObject({
      enabled: true,
      source: "organization",
    });
  });

  it("rejects unknown stores", async () => {
    const { featureFlagService } = createMemoryFeatureFlagModule();

    await expect(
      featureFlagService.listFeatureFlags({
        storeId: "99999999-9999-9999-9999-999999999999",
        page: 1,
        limit: 20,
      }),
    ).rejects.toMatchObject({
      code: FEATURE_FLAG_ERROR_CODES.STORE_NOT_FOUND,
      status: 404,
    });
  });
});
