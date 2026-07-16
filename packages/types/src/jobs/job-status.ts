/** Background job lifecycle states. */
export const JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
