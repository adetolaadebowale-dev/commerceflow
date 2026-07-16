import type {
  EmailProviderType,
  NotificationProviderType,
  NotificationResult,
} from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";

import type { EmailService } from "../email/services/email.service";

export function toEmailProviderType(
  provider: NotificationProviderType,
): EmailProviderType {
  return provider;
}

export function mapEmailSendResultToNotificationResult(
  result: Awaited<ReturnType<EmailService["sendEmail"]>>,
): Pick<NotificationResult, "success" | "message" | "providerReference" | "metadata"> {
  return {
    success: result.success,
    message: result.message,
    providerReference: result.providerReference,
    metadata: result.metadata,
  };
}

export function buildEmailMessageFromNotification(
  notification: {
    id: string;
    storeId: string;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
  },
  input: CreateNotificationInput,
) {
  return {
    storeId: notification.storeId,
    notificationId: notification.id,
    to: input.to!,
    subject: notification.subject ?? "Notification",
    body: notification.body,
    metadata: notification.metadata,
  };
}
