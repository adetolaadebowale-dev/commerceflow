import type { Job } from "@commerceflow/types";

import { JOB_ERROR_CODES, JobError } from "../errors";

export class JobScheduler {
  resolveScheduledFor(scheduledFor?: string): string {
    if (scheduledFor === undefined) {
      return new Date().toISOString();
    }

    const date = new Date(scheduledFor);

    if (Number.isNaN(date.getTime())) {
      throw new JobError(
        JOB_ERROR_CODES.VALIDATION_ERROR,
        "scheduledFor must be a valid ISO datetime",
        400,
      );
    }

    return date.toISOString();
  }

  isDue(job: Job, asOf: Date = new Date()): boolean {
    return new Date(job.scheduledFor) <= asOf;
  }
}

export const jobScheduler = new JobScheduler();
