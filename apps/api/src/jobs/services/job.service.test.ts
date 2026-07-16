import { describe, expect, it } from "vitest";

import { JOB_SIMULATE_FAILURE_KEY } from "../executors/job-executor";
import { MemoryJobExecutor } from "../executors/memory-job.executor";
import {
  createMemoryJobModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCreateJobInput,
} from "../testing/job-test-utils";

describe("JobService", () => {
  it("creates a pending job", async () => {
    const module = createMemoryJobModule();
    const job = await module.jobService.createJob(validCreateJobInput());

    expect(job.status).toBe("pending");
    expect(job.type).toBe("noop");
    expect(job.scheduledFor).toBeDefined();
  });

  it("runs a pending job to completion", async () => {
    const memoryJobExecutor = new MemoryJobExecutor();
    const module = createMemoryJobModule({ memoryJobExecutor });
    const created = await module.jobService.createJob(validCreateJobInput());

    const job = await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    expect(job.status).toBe("completed");
    expect(job.startedAt).toBeDefined();
    expect(job.completedAt).toBeDefined();
    expect(memoryJobExecutor.getExecutions()).toHaveLength(1);
  });

  it("prevents completed jobs from running again", async () => {
    const module = createMemoryJobModule();
    const created = await module.jobService.createJob(validCreateJobInput());
    await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    await expect(
      module.jobService.runJob(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: "JOB_ALREADY_COMPLETED",
      status: 409,
    });
  });

  it("marks jobs failed when execution fails", async () => {
    const module = createMemoryJobModule();
    const created = await module.jobService.createJob(
      validCreateJobInput({
        payload: { [JOB_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    const job = await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    expect(job.status).toBe("failed");
    expect(job.failureReason).toBe("Simulated job failure");
  });

  it("lists jobs with pagination", async () => {
    const module = createMemoryJobModule();

    for (let index = 0; index < 3; index += 1) {
      await module.jobService.createJob(validCreateJobInput());
    }

    const result = await module.jobService.listJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
    });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
  });

  it("isolates jobs by store", async () => {
    const module = createMemoryJobModule();
    const job = await module.jobService.createJob(validCreateJobInput());

    await expect(
      module.jobService.getJob(TEST_STORE_B_ID, job.id),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});
