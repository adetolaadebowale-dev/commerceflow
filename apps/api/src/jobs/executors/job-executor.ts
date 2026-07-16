import type { Job } from "@commerceflow/types";

export interface JobExecutionResult {
  readonly success: boolean;
  readonly message?: string;
}

export interface JobExecutor {
  execute(job: Job): Promise<JobExecutionResult>;
}

export const JOB_SIMULATE_FAILURE_KEY = "simulateFailure";
