import { sendTestSmsNotificationSchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { handleNotificationRouteError, jsonSuccess } from "../../routes/http-response";
import { notificationService } from "../../services";
import { SMS_ERROR_CODES, SmsError } from "../errors";

function smsAuditMetadata(notification: {
  id: string;
  status: string;
}) {
  return {
    notificationId: notification.id,
    status: notification.status,
  };
}

export async function handleSendTestSmsNotification(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = sendTestSmsNotificationSchema.safeParse(body);

    if (!parsed.success) {
      throw new SmsError(
        SMS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:write",
    );

    const notification = await notificationService.sendTestSmsNotification(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "create",
      metadata: {
        channel: notification.channel,
        status: notification.status,
      },
    });

    if (notification.status === "sent") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "sms_notification",
        entityId: notification.id,
        action: "send",
        metadata: smsAuditMetadata(notification),
      });

      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "send",
        metadata: {
          channel: notification.channel,
          status: notification.status,
        },
      });
    }

    if (notification.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "sms_notification",
        entityId: notification.id,
        action: "fail",
        metadata: smsAuditMetadata(notification),
      });

      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "fail",
        metadata: {
          channel: notification.channel,
          status: notification.status,
        },
      });
    }

    return jsonSuccess({ notification }, 201);
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}
