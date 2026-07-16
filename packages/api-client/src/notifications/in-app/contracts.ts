import type { CatalogueListResult, InAppNotification } from "@commerceflow/types";
import type {
  InAppNotificationQuery,
  ListInAppNotificationsQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../../common/api-response";

/** GET /notifications/in-app */
export type ListInAppNotificationsParams = ListInAppNotificationsQuery;
export type ListInAppNotificationsResponse = ApiSuccessResponse<
  CatalogueListResult<InAppNotification>
>;

/** GET /notifications/in-app/:id */
export type GetInAppNotificationParams = InAppNotificationQuery;
export type GetInAppNotificationResponse = ApiSuccessResponse<{
  notification: InAppNotification;
}>;

/** POST /notifications/in-app/:id/read */
export type MarkInAppNotificationReadParams = InAppNotificationQuery;
export type MarkInAppNotificationReadResponse = ApiSuccessResponse<{
  notification: InAppNotification;
}>;

/** POST /notifications/in-app/:id/unread */
export type MarkInAppNotificationUnreadParams = InAppNotificationQuery;
export type MarkInAppNotificationUnreadResponse = ApiSuccessResponse<{
  notification: InAppNotification;
}>;
