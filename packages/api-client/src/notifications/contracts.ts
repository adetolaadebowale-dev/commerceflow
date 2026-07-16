import type {
  CatalogueListResult,
  Notification,
} from "@commerceflow/types";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /notifications */
export type CreateNotificationRequest = CreateNotificationInput;
export type CreateNotificationResponse = ApiSuccessResponse<{
  notification: Notification;
}>;

/** GET /notifications/:id */
export type GetNotificationResponse = ApiSuccessResponse<{
  notification: Notification;
}>;

/** GET /notifications */
export type ListNotificationsParams = ListNotificationsQuery;
export type ListNotificationsResponse = ApiSuccessResponse<
  CatalogueListResult<Notification>
>;

export type NotificationStoreScopedParams = Pick<ListNotificationsQuery, "storeId">;
