/** Lifecycle statuses for persisted notification records. */
export const NOTIFICATION_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
