/** Supported background job types for the foundation sprint. */
export const JOB_TYPES = ["noop", "notification.dispatch"] as const;

export type JobType = (typeof JOB_TYPES)[number];
