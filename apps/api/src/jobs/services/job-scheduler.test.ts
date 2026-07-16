import { describe, expect, it } from "vitest";

import { JobScheduler } from "./job-scheduler";

describe("JobScheduler", () => {
  it("defaults scheduledFor to the current time", () => {
    const scheduler = new JobScheduler();
    const scheduledFor = scheduler.resolveScheduledFor();

    expect(new Date(scheduledFor).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("preserves a valid scheduledFor value", () => {
    const scheduler = new JobScheduler();
    const scheduledFor = scheduler.resolveScheduledFor("2026-12-01T10:00:00.000Z");

    expect(scheduledFor).toBe("2026-12-01T10:00:00.000Z");
  });

  it("detects due jobs without executing them", () => {
    const scheduler = new JobScheduler();
    const due = scheduler.isDue(
      {
        id: "job-id",
        storeId: "store-id",
        type: "noop",
        status: "pending",
        payload: {},
        scheduledFor: "2020-01-01T00:00:00.000Z",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(due).toBe(true);
  });
});
