import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { JOB_SIMULATE_FAILURE_KEY } from "../executors/job-executor";
import {
  createMemoryJobModule,
  TEST_STORE_A_ID,
  validCreateJobInput,
} from "../testing/job-test-utils";

describe("JobService domain events", () => {
  it("emits job.created when creating a job", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    dispatcher.subscribe("job.created", createdHandler);

    const module = createMemoryJobModule({ domainEventPublisher: publisher });
    const job = await module.jobService.createJob(validCreateJobInput());

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
    });

    expect(createdHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "job.created",
      aggregateId: job.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits job.started, job.completed on successful execution", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const startedHandler = vi.fn();
    const completedHandler = vi.fn();
    dispatcher.subscribe("job.started", startedHandler);
    dispatcher.subscribe("job.completed", completedHandler);

    const module = createMemoryJobModule({ domainEventPublisher: publisher });
    const created = await module.jobService.createJob(validCreateJobInput());
    await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    await vi.waitFor(() => {
      expect(startedHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
    });
  });

  it("emits job.started and job.failed on execution failure", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const startedHandler = vi.fn();
    const failedHandler = vi.fn();
    dispatcher.subscribe("job.started", startedHandler);
    dispatcher.subscribe("job.failed", failedHandler);

    const module = createMemoryJobModule({ domainEventPublisher: publisher });
    const created = await module.jobService.createJob(
      validCreateJobInput({
        payload: { [JOB_SIMULATE_FAILURE_KEY]: true },
      }),
    );

    await module.jobService.runJob(TEST_STORE_A_ID, created.id);

    await vi.waitFor(() => {
      expect(startedHandler).toHaveBeenCalledOnce();
      expect(failedHandler).toHaveBeenCalledOnce();
    });
  });
});
