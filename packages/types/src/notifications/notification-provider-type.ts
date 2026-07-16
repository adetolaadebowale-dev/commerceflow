/** Provider adapters available for notification delivery. */
export const NOTIFICATION_PROVIDER_TYPES = ["console", "memory"] as const;

export type NotificationProviderType =
  (typeof NOTIFICATION_PROVIDER_TYPES)[number];
