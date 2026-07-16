import type { NotificationChannel } from "./notification-channel";
import type { NotificationStatus } from "./notification-status";

/** Store-scoped notification record. */
export interface Notification {
  readonly id: string;
  readonly storeId: string;
  readonly userId?: string;
  readonly customerId?: string;
  readonly channel: NotificationChannel;
  readonly status: NotificationStatus;
  readonly subject?: string;
  readonly title?: string;
  readonly body: string;
  readonly metadata?: Record<string, unknown>;
  readonly sentAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
