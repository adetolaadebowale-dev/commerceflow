import { describe, expect, it } from "vitest";

import {
  createMemoryDisasterReadinessModule,
  TEST_STORE_A_ID,
} from "../testing/disaster-readiness-test-utils";

describe("DisasterReadinessFacade", () => {
  it("reports backup diagnostics and verification status", async () => {
    const module = createMemoryDisasterReadinessModule({
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    await module.configurationRepository.updateBackupConfiguration({
      enabled: true,
      provider: "managed",
      retentionDays: 14,
      lastVerifiedAt: "2026-07-16T12:00:00.000Z",
      notes: "Nightly managed snapshots",
    });

    const backups = await module.disasterReadinessFacade.getBackups();
    expect(backups.configuration.enabled).toBe(true);
    expect(backups.verification.status).toBe("verified");

    const verification =
      await module.disasterReadinessFacade.getBackupVerification();
    expect(verification.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "backup_enabled", status: "pass" }),
        expect.objectContaining({
          name: "verification_freshness",
          status: "pass",
        }),
      ]),
    );
  });

  it("generates a recovery plan and updates RPO/RTO", async () => {
    const module = createMemoryDisasterReadinessModule();

    const plan = await module.disasterReadinessFacade.getRecoveryPlan();
    expect(plan.checklist.length).toBeGreaterThan(0);
    expect(plan.objectives.rpoMinutes).toBe(1_440);

    const updated =
      await module.disasterReadinessFacade.updateRecoveryObjectives({
        storeId: TEST_STORE_A_ID,
        rpoMinutes: 60,
        rtoMinutes: 120,
      });

    expect(updated).toMatchObject({
      rpoMinutes: 60,
      rtoMinutes: 120,
    });

    const after = await module.disasterReadinessFacade.getRecoveryPlan();
    expect(after.objectives.rpoMinutes).toBe(60);
  });

  it("summarizes disaster readiness", async () => {
    const module = createMemoryDisasterReadinessModule({
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    await module.configurationRepository.updateBackupConfiguration({
      enabled: true,
      provider: "manual",
      retentionDays: 7,
      lastVerifiedAt: "2026-07-17T10:00:00.000Z",
    });
    await module.configurationRepository.updateRecoveryObjectives({
      rpoMinutes: 60,
      rtoMinutes: 120,
    });

    const summary =
      await module.disasterReadinessFacade.getDisasterReadiness();

    expect(summary.status).toBe("ready");
    expect(summary.backups.verification.status).toBe("verified");
    expect(summary.recovery.objectives.rtoMinutes).toBe(120);
  });

  it("marks readiness not_ready when verification failed", async () => {
    const module = createMemoryDisasterReadinessModule();

    const summary =
      await module.disasterReadinessFacade.getDisasterReadiness();

    expect(summary.backups.verification.status).toBe("failed");
    expect(summary.status).toBe("not_ready");
  });
});
