import type {
  NotificationProviderType,
  NotificationResult,
  SmsProviderType,
} from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";

import type { SmsService } from "../sms/services/sms.service";

export function toSmsProviderType(
  provider: NotificationProviderType,
): SmsProviderType {
  return provider;
}

export function mapSmsSendResultToNotificationResult(
  result: Awaited<ReturnType<SmsService["sendSms"]>>,
): Pick<NotificationResult, "success" | "message" | "providerReference" | "metadata"> {
  return {
    success: result.success,
    message: result.message,
    providerReference: result.providerReference,
    metadata: result.metadata,
  };
}

export function buildSmsMessageFromNotification(
  notification: {
    id: string;
    storeId: string;
    body: string;
    metadata?: Record<string, unknown>;
  },
  input: CreateNotificationInput,
) {
  return {
    storeId: notification.storeId,
    notificationId: notification.id,
    to: input.smsTo!,
    body: notification.body,
    metadata: notification.metadata,
  };
}
