import { describe, expect, it } from "vitest";

import {
  createMemoryDeploymentReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/deployment-readiness-test-utils";

describe("DeploymentReadinessService", () => {
  it("reports environment diagnostics and required configuration checks", async () => {
    const module = createMemoryDeploymentReadinessModule();

    const environment =
      await module.deploymentReadinessService.getEnvironmentDiagnostics();

    expect(environment.valid).toBe(true);
    expect(environment.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "DATABASE_URL", status: "pass" }),
        expect.objectContaining({ key: "PUBLIC_HTTPS", status: "pass" }),
        expect.objectContaining({ key: "NODE_VERSION", status: "pass" }),
      ]),
    );
  });

  it("returns release metadata and version compatibility", async () => {
    const module = createMemoryDeploymentReadinessModule({
      now: () => new Date("2026-07-17T18:00:00.000Z"),
    });

    const release = await module.deploymentReadinessService.getReleaseMetadata();

    expect(release).toMatchObject({
      name: "api",
      version: "0.1.0",
      channel: "stable",
      compatibleNodeRange: ">=20",
      buildId: "build-test-1",
      checkedAt: "2026-07-17T18:00:00.000Z",
    });

    const readiness = await module.deploymentReadinessService.getReadiness();
    expect(readiness.versionCompatibility.compatible).toBe(true);
  });

  it("updates deployment configuration and builds checklist", async () => {
    const module = createMemoryDeploymentReadinessModule();

    const configuration =
      await module.deploymentReadinessService.updateConfiguration({
        storeId: TEST_STORE_A_ID,
        target: "production",
        requireHttps: true,
        requireMigrationsApplied: true,
        minimumNodeVersion: "20.11",
        releaseChannel: "stable",
        notes: "Production cutover",
      });

    expect(configuration.target).toBe("production");
    expect(configuration.releaseChannel).toBe("stable");

    const checklist = await module.deploymentReadinessService.getChecklist();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.every((item) => item.completed)).toBe(true);

    const readiness = await module.deploymentReadinessService.getReadiness();
    expect(readiness.status).toBe("ready");
  });

  it("blocks readiness when required environment checks fail", async () => {
    const module = createMemoryDeploymentReadinessModule({
      env: { NODE_ENV: "production" },
      environment: "production",
      nodeVersion: "v18.0.0",
      migrationsApplied: false,
    });

    await module.deploymentReadinessService.updateConfiguration({
      storeId: TEST_STORE_A_ID,
      target: "production",
      requireHttps: true,
      requireMigrationsApplied: true,
      minimumNodeVersion: "20",
      releaseChannel: "stable",
    });

    const readiness = await module.deploymentReadinessService.getReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.environment.valid).toBe(false);
    expect(readiness.versionCompatibility.compatible).toBe(false);
  });
});
