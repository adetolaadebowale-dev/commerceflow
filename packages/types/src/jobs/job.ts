import type { JobStatus } from "./job-status";

/** Store-scoped background job record. */
export interface Job {
  readonly id: string;
  readonly storeId: string;
  readonly type: string;
  readonly status: JobStatus;
  readonly payload: Record<string, unknown>;
  readonly scheduledFor: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
