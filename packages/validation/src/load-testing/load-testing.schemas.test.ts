import { describe, expect, it } from "vitest";

import {
  loadTestingStoreQuerySchema,
  updateLoadTestingConfigurationSchema,
} from "./load-testing.schemas";

describe("load testing schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(loadTestingStoreQuerySchema.parse({ storeId: validUuid })).toEqual({
      storeId: validUuid,
    });
  });

  it("accepts load testing configuration updates", () => {
    const parsed = updateLoadTestingConfigurationSchema.parse({
      storeId: validUuid,
      enabled: true,
      preferredTool: "k6",
      targetVirtualUsers: 100,
      durationSeconds: 300,
      rampUpSeconds: 60,
      notes: "Nightly staging run",
    });

    expect(parsed.preferredTool).toBe("k6");
    expect(parsed.targetVirtualUsers).toBe(100);
  });

  it("rejects invalid tools and limits", () => {
    expect(() =>
      updateLoadTestingConfigurationSchema.parse({
        storeId: validUuid,
        enabled: true,
        preferredTool: "locust",
        targetVirtualUsers: 10,
        durationSeconds: 60,
        rampUpSeconds: 10,
      }),
    ).toThrow();

    expect(() =>
      updateLoadTestingConfigurationSchema.parse({
        storeId: validUuid,
        enabled: true,
        preferredTool: "manual",
        targetVirtualUsers: 0,
        durationSeconds: 60,
        rampUpSeconds: 10,
      }),
    ).toThrow();
  });
});
