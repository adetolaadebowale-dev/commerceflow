import { ConsoleJobExecutor } from "./console-job.executor";
import type { JobExecutionResult, JobExecutor } from "./job-executor";
import { JOB_SIMULATE_FAILURE_KEY } from "./job-executor";

export class DefaultJobExecutorFactory {
  constructor(
    private readonly executors: ReadonlyMap<string, JobExecutor> = new Map(),
  ) {}

  resolve(type: string): JobExecutor {
    return this.executors.get(type) ?? new ConsoleJobExecutor();
  }
}

let jobExecutorFactory: DefaultJobExecutorFactory | undefined;

export function getJobExecutorFactory(): DefaultJobExecutorFactory {
  if (!jobExecutorFactory) {
    jobExecutorFactory = new DefaultJobExecutorFactory(
      new Map([["noop", new ConsoleJobExecutor()]]),
    );
  }

  return jobExecutorFactory;
}

export { ConsoleJobExecutor } from "./console-job.executor";
export { MemoryJobExecutor } from "./memory-job.executor";
export {
  JOB_SIMULATE_FAILURE_KEY,
  type JobExecutor,
  type JobExecutionResult,
};
