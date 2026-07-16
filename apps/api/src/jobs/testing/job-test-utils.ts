import type { CreateJobInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import {
  DefaultJobExecutorFactory,
  MemoryJobExecutor,
} from "../executors";
import { MemoryJobRepository } from "../repositories/memory-job.repository";
import { JobScheduler } from "../services/job-scheduler";
import { JobService } from "../services/job.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryJobModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  memoryJobExecutor?: MemoryJobExecutor;
} = {}) {
  const jobRepository = new MemoryJobRepository();
  const memoryJobExecutor = options.memoryJobExecutor ?? new MemoryJobExecutor();

  return {
    jobRepository,
    memoryJobExecutor,
    jobScheduler: new JobScheduler(),
    jobService: new JobService({
      jobRepository,
      jobExecutorFactory: new DefaultJobExecutorFactory(
        new Map([["noop", memoryJobExecutor]]),
      ),
      jobScheduler: new JobScheduler(),
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validCreateJobInput(
  overrides: Partial<CreateJobInput> = {},
): CreateJobInput {
  return {
    storeId: TEST_STORE_A_ID,
    type: "noop",
    payload: {},
    ...overrides,
  };
}
