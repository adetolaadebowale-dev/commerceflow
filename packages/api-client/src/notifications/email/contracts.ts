import type { Notification } from "@commerceflow/types";
import type { SendTestEmailNotificationInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../../common/api-response";

/** POST /notifications/email/test */
export type SendTestEmailNotificationRequest = SendTestEmailNotificationInput;
export type SendTestEmailNotificationResponse = ApiSuccessResponse<{
  notification: Notification;
}>;
