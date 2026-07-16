import type { Job } from "@commerceflow/types";

import {
  JOB_SIMULATE_FAILURE_KEY,
  type JobExecutionResult,
  type JobExecutor,
} from "./job-executor";

export class MemoryJobExecutor implements JobExecutor {
  private readonly executions: Job[] = [];

  async execute(job: Job): Promise<JobExecutionResult> {
    this.executions.push(job);

    if (job.payload[JOB_SIMULATE_FAILURE_KEY] === true) {
      return {
        success: false,
        message: "Simulated job failure",
      };
    }

    return { success: true };
  }

  getExecutions(): readonly Job[] {
    return [...this.executions];
  }

  clear(): void {
    this.executions.length = 0;
  }
}
