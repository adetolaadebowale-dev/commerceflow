export const RETURN_STATUSES = [
  "requested",
  "received",
  "inspecting",
  "completed",
  "rejected",
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];
