import type { NotificationStatus } from "../notification-status";

/** In-app notification surfaced in a user's notification center. */
export interface InAppNotification {
  readonly id: string;
  readonly storeId: string;
  readonly userId: string;
  readonly title?: string;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly isRead: boolean;
  readonly readAt?: string;
  readonly sentAt?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
