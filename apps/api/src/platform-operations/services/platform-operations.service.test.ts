import { describe, expect, it } from "vitest";

import {
  createMemoryPlatformOperationsModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/platform-operations-test-utils";

describe("PlatformOperationsService", () => {
  it("reports liveness as live", async () => {
    const module = createMemoryPlatformOperationsModule();

    await expect(module.platformOperationsService.getLiveness()).resolves.toEqual(
      expect.objectContaining({ live: true }),
    );
  });

  it("reports readiness based on database ping", async () => {
    const module = createMemoryPlatformOperationsModule();

    await expect(
      module.platformOperationsService.getReadiness(),
    ).resolves.toMatchObject({
      ready: true,
      checks: [{ name: "database", status: "pass" }],
    });

    module.platformConfigurationRepository.setPingResult(false);

    await expect(
      module.platformOperationsService.getReadiness(),
    ).resolves.toMatchObject({
      ready: false,
      checks: [{ name: "database", status: "fail" }],
    });
  });

  it("includes maintenance state in health summary", async () => {
    const module = createMemoryPlatformOperationsModule();

    await module.platformOperationsService.updateMaintenanceMode({
      storeId: TEST_STORE_A_ID,
      maintenanceMode: true,
      maintenanceMessage: "Scheduled maintenance",
    });

    const health = await module.platformOperationsService.getHealth();

    expect(health.status).toBe("degraded");
    expect(health.maintenance).toMatchObject({
      maintenanceMode: true,
      maintenanceMessage: "Scheduled maintenance",
    });
    expect(health.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "maintenance", status: "warn" }),
      ]),
    );
  });

  it("returns application version information", () => {
    const module = createMemoryPlatformOperationsModule();

    expect(module.platformOperationsService.getVersion()).toEqual({
      name: "api",
      version: "0.1.0",
      environment: "test",
      nodeVersion: "v20.0.0",
    });
  });

  it("enables and disables maintenance mode", async () => {
    const module = createMemoryPlatformOperationsModule();

    const enabled = await module.platformOperationsService.updateMaintenanceMode({
      storeId: TEST_STORE_A_ID,
      maintenanceMode: true,
      maintenanceMessage: "Upgrading",
    });

    expect(enabled.maintenanceMode).toBe(true);
    expect(enabled.maintenanceMessage).toBe("Upgrading");

    const disabled =
      await module.platformOperationsService.updateMaintenanceMode({
        storeId: TEST_STORE_A_ID,
        maintenanceMode: false,
        maintenanceMessage: null,
      });

    expect(disabled.maintenanceMode).toBe(false);
    expect(disabled.maintenanceMessage).toBeUndefined();
  });

  it("builds diagnostics with configuration and job summary", async () => {
    const module = createMemoryPlatformOperationsModule();

    await module.jobRepository.create(
      { storeId: TEST_STORE_A_ID, type: "noop", payload: {} },
      "2026-07-17T10:00:00.000Z",
    );
    await module.jobRepository.create(
      { storeId: TEST_STORE_B_ID, type: "noop", payload: {} },
      "2026-07-17T11:00:00.000Z",
    );

    const diagnostics = await module.platformOperationsService.getDiagnostics(
      TEST_STORE_A_ID,
    );

    expect(diagnostics.configuration.valid).toBe(true);
    expect(diagnostics.jobs).toMatchObject({
      storeId: TEST_STORE_A_ID,
      total: 1,
      byStatus: {
        pending: 1,
        running: 0,
        completed: 0,
        failed: 0,
      },
    });
  });

  it("isolates job summaries by store", async () => {
    const module = createMemoryPlatformOperationsModule();

    await module.jobRepository.create(
      { storeId: TEST_STORE_A_ID, type: "noop", payload: {} },
      "2026-07-17T10:00:00.000Z",
    );
    await module.jobRepository.create(
      { storeId: TEST_STORE_B_ID, type: "noop", payload: {} },
      "2026-07-17T11:00:00.000Z",
    );
    await module.jobRepository.create(
      { storeId: TEST_STORE_B_ID, type: "noop", payload: {} },
      "2026-07-17T12:00:00.000Z",
    );

    const storeA = await module.platformOperationsService.getJobSummary(
      TEST_STORE_A_ID,
    );
    const storeB = await module.platformOperationsService.getJobSummary(
      TEST_STORE_B_ID,
    );

    expect(storeA.total).toBe(1);
    expect(storeB.total).toBe(2);
  });
});
