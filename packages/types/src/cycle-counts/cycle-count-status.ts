export const CYCLE_COUNT_STATUSES = [
  "draft",
  "counting",
  "completed",
  "approved",
] as const;

export type CycleCountStatus = (typeof CYCLE_COUNT_STATUSES)[number];
