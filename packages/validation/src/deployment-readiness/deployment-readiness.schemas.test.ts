import { describe, expect, it } from "vitest";

import {
  deploymentReadinessStoreQuerySchema,
  updateDeploymentConfigurationSchema,
} from "./deployment-readiness.schemas";

describe("deployment readiness schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(
      deploymentReadinessStoreQuerySchema.parse({ storeId: validUuid }),
    ).toEqual({ storeId: validUuid });
  });

  it("accepts deployment configuration updates", () => {
    const parsed = updateDeploymentConfigurationSchema.parse({
      storeId: validUuid,
      target: "production",
      requireHttps: true,
      requireMigrationsApplied: true,
      minimumNodeVersion: "20.11.0",
      releaseChannel: "stable",
      notes: "Cutover window",
    });

    expect(parsed.target).toBe("production");
    expect(parsed.minimumNodeVersion).toBe("20.11.0");
  });

  it("rejects invalid targets and channels", () => {
    expect(() =>
      updateDeploymentConfigurationSchema.parse({
        storeId: validUuid,
        target: "qa",
        requireHttps: true,
        requireMigrationsApplied: true,
        minimumNodeVersion: "20",
        releaseChannel: "stable",
      }),
    ).toThrow();

    expect(() =>
      updateDeploymentConfigurationSchema.parse({
        storeId: validUuid,
        target: "staging",
        requireHttps: true,
        requireMigrationsApplied: true,
        minimumNodeVersion: "twenty",
        releaseChannel: "Stable",
      }),
    ).toThrow();
  });
});
