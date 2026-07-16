import type { Job } from "@commerceflow/types";

import {
  JOB_SIMULATE_FAILURE_KEY,
  type JobExecutionResult,
  type JobExecutor,
} from "./job-executor";

export class ConsoleJobExecutor implements JobExecutor {
  async execute(job: Job): Promise<JobExecutionResult> {
    if (job.payload[JOB_SIMULATE_FAILURE_KEY] === true) {
      return {
        success: false,
        message: "Simulated job failure",
      };
    }

    console.info("[ConsoleJobExecutor]", {
      jobId: job.id,
      storeId: job.storeId,
      type: job.type,
    });

    return { success: true };
  }
}
