import type { Notification } from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListInAppNotificationsQuery,
  ListNotificationsQuery,
} from "@commerceflow/validation";

export interface NotificationRepository {
  findById(storeId: string, id: string): Promise<Notification | null>;
  list(query: ListNotificationsQuery): Promise<{
    items: readonly Notification[];
    total: number;
    page: number;
    limit: number;
  }>;
  listInApp(query: ListInAppNotificationsQuery): Promise<{
    items: readonly Notification[];
    total: number;
    page: number;
    limit: number;
  }>;
  create(input: CreateNotificationInput): Promise<Notification>;
  markSent(
    storeId: string,
    id: string,
    sentAt: string,
  ): Promise<Notification>;
  markFailed(storeId: string, id: string): Promise<Notification>;
  markRead(
    storeId: string,
    id: string,
    readAt: string,
  ): Promise<Notification>;
  markUnread(storeId: string, id: string): Promise<Notification>;
}
