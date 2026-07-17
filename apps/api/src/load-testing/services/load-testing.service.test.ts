import { describe, expect, it } from "vitest";

import {
  createMemoryLoadTestingModule,
  TEST_STORE_A_ID,
} from "../testing/load-testing-test-utils";

describe("LoadTestingService", () => {
  it("returns endpoint performance baselines", () => {
    const module = createMemoryLoadTestingModule({
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    const baselines = module.loadTestingService.getBaselines();

    expect(baselines.recordedAt).toBe("2026-07-17T12:00:00.000Z");
    expect(baselines.endpoints.length).toBeGreaterThan(0);
    expect(baselines.endpoints[0]).toEqual(
      expect.objectContaining({
        endpointKey: expect.any(String),
        method: expect.any(String),
        path: expect.any(String),
        p95Ms: expect.any(Number),
        maxRps: expect.any(Number),
      }),
    );
  });

  it("updates load testing configuration", async () => {
    const module = createMemoryLoadTestingModule();

    const configuration = await module.loadTestingService.updateConfiguration({
      storeId: TEST_STORE_A_ID,
      enabled: true,
      preferredTool: "k6",
      targetVirtualUsers: 100,
      durationSeconds: 600,
      rampUpSeconds: 120,
      notes: "Staging campaign",
    });

    expect(configuration).toMatchObject({
      enabled: true,
      preferredTool: "k6",
      targetVirtualUsers: 100,
      durationSeconds: 600,
      rampUpSeconds: 120,
      notes: "Staging campaign",
    });

    const summary = await module.loadTestingService.getSummary();
    expect(summary.configuration.enabled).toBe(true);
    expect(summary.assessment.configuration.preferredTool).toBe("k6");
  });

  it("assesses scalability and emits capacity recommendations", async () => {
    const module = createMemoryLoadTestingModule();

    await module.loadTestingService.updateConfiguration({
      storeId: TEST_STORE_A_ID,
      enabled: true,
      preferredTool: "manual",
      targetVirtualUsers: 1000,
      durationSeconds: 300,
      rampUpSeconds: 60,
    });

    const scalability = await module.loadTestingService.getAssessment();

    expect(scalability.status).toBe("at_risk");
    expect(scalability.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "staged-ramp", severity: "warn" }),
        expect.objectContaining({
          severity: "critical",
          relatedEndpointKey: expect.any(String),
        }),
      ]),
    );
  });

  it("marks assessment needs_attention when configuration is disabled", async () => {
    const module = createMemoryLoadTestingModule();

    const scalability = await module.loadTestingService.getAssessment();

    expect(scalability.configuration.enabled).toBe(false);
    expect(scalability.status).toBe("needs_attention");
  });
});
