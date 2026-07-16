import type { InAppNotification, Notification } from "@commerceflow/types";

export function toInAppNotification(
  notification: Notification,
): InAppNotification {
  if (notification.channel !== "in_app") {
    throw new Error("Notification is not an in-app notification");
  }

  if (!notification.userId) {
    throw new Error("In-app notification is missing user id");
  }

  return {
    id: notification.id,
    storeId: notification.storeId,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    status: notification.status,
    isRead: Boolean(notification.readAt),
    readAt: notification.readAt,
    sentAt: notification.sentAt,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

export function isInAppNotificationForUser(
  notification: Notification,
  userId: string,
): boolean {
  return (
    notification.channel === "in_app" &&
    notification.userId === userId &&
    notification.status === "sent"
  );
}
