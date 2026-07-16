import type { Notification } from "@commerceflow/types";
import type { SendTestSmsNotificationInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../../common/api-response";

/** POST /notifications/sms/test */
export type SendTestSmsNotificationRequest = SendTestSmsNotificationInput;
export type SendTestSmsNotificationResponse = ApiSuccessResponse<{
  notification: Notification;
}>;
