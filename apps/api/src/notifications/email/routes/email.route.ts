import { sendTestEmailNotificationSchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { EMAIL_ERROR_CODES, EmailError } from "../errors";
import { handleNotificationRouteError, jsonSuccess } from "../../routes/http-response";
import { notificationService } from "../../services";

function emailAuditMetadata(notification: {
  id: string;
  subject?: string;
  status: string;
}) {
  return {
    notificationId: notification.id,
    subject: notification.subject,
    status: notification.status,
  };
}

export async function handleSendTestEmailNotification(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = sendTestEmailNotificationSchema.safeParse(body);

    if (!parsed.success) {
      throw new EmailError(
        EMAIL_ERROR_CODES.VALIDATION_ERROR,
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

    const notification = await notificationService.sendTestEmailNotification(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "create",
      metadata: {
        channel: notification.channel,
        status: notification.status,
        subject: notification.subject,
      },
    });

    if (notification.status === "sent") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "email_notification",
        entityId: notification.id,
        action: "send",
        metadata: emailAuditMetadata(notification),
      });

      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "send",
        metadata: {
          channel: notification.channel,
          status: notification.status,
          subject: notification.subject,
        },
      });
    }

    if (notification.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "email_notification",
        entityId: notification.id,
        action: "fail",
        metadata: emailAuditMetadata(notification),
      });

      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "fail",
        metadata: {
          channel: notification.channel,
          status: notification.status,
          subject: notification.subject,
        },
      });
    }

    return jsonSuccess({ notification }, 201);
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}