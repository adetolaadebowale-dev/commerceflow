import { describe, expect, it } from "vitest";

import { MemoryJobExecutor } from "./memory-job.executor";
import { JOB_SIMULATE_FAILURE_KEY } from "./job-executor";

describe("Job executors", () => {
  it("executes jobs successfully by default", async () => {
    const executor = new MemoryJobExecutor();
    const result = await executor.execute({
      id: "job-id",
      storeId: "store-id",
      type: "noop",
      status: "pending",
      payload: {},
      scheduledFor: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    expect(executor.getExecutions()).toHaveLength(1);
  });

  it("simulates provider failure when requested in payload", async () => {
    const executor = new MemoryJobExecutor();
    const result = await executor.execute({
      id: "job-id",
      storeId: "store-id",
      type: "noop",
      status: "pending",
      payload: { [JOB_SIMULATE_FAILURE_KEY]: true },
      scheduledFor: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Simulated job failure");
  });
});
