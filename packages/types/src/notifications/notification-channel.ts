/** Delivery channels supported by the notification infrastructure. */
export const NOTIFICATION_CHANNELS = [
  "email",
  "sms",
  "in_app",
  "webhook",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
