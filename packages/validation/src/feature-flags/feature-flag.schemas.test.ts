import { describe, expect, it } from "vitest";

import {
  effectiveFeatureFlagsQuerySchema,
  featureFlagKeySchema,
  listFeatureFlagsQuerySchema,
  upsertFeatureFlagSchema,
} from "./feature-flag.schemas";

describe("feature flag schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid upsert payload", () => {
    const parsed = upsertFeatureFlagSchema.parse({
      storeId: validUuid,
      scope: "organization",
      enabled: true,
      description: "Enable new reporting",
    });

    expect(parsed).toEqual({
      storeId: validUuid,
      scope: "organization",
      enabled: true,
      description: "Enable new reporting",
    });
  });

  it("rejects invalid feature flag keys", () => {
    expect(() => featureFlagKeySchema.parse("Invalid_Key")).toThrow();
    expect(() => featureFlagKeySchema.parse("")).toThrow();
    expect(featureFlagKeySchema.parse("new-checkout")).toBe("new-checkout");
  });

  it("accepts list query pagination defaults", () => {
    const parsed = listFeatureFlagsQuerySchema.parse({
      storeId: validUuid,
    });

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it("parses comma-separated effective keys", () => {
    const parsed = effectiveFeatureFlagsQuerySchema.parse({
      storeId: validUuid,
      keys: "alpha, beta ,gamma",
    });

    expect(parsed.keys).toEqual(["alpha", "beta", "gamma"]);
  });

  it("rejects invalid scopes and store ids", () => {
    expect(() =>
      upsertFeatureFlagSchema.parse({
        storeId: "not-a-uuid",
        scope: "store",
        enabled: true,
      }),
    ).toThrow();

    expect(() =>
      upsertFeatureFlagSchema.parse({
        storeId: validUuid,
        scope: "experiment",
        enabled: true,
      }),
    ).toThrow();
  });
});
