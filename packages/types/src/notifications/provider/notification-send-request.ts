import type { NotificationChannel } from "../notification-channel";

/** Provider-agnostic payload for a single notification send attempt. */
export interface NotificationSendRequest {
  readonly notificationId: string;
  readonly storeId: string;
  readonly channel: NotificationChannel;
  readonly subject?: string;
  readonly title?: string;
  readonly body: string;
  readonly userId?: string;
  readonly customerId?: string;
  readonly metadata?: Record<string, unknown>;
}
