import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { NOTIFICATION_ERROR_CODES, NotificationError } from "../errors";
import { notificationService } from "../services";
import { handleNotificationRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function notificationAuditMetadata(notification: {
  channel: string;
  status: string;
  subject?: string;
  title?: string;
}) {
  return {
    channel: notification.channel,
    status: notification.status,
    subject: notification.subject,
    title: notification.title,
  };
}

export async function handleCreateNotification(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createNotificationSchema.safeParse(body);

    if (!parsed.success) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.VALIDATION_ERROR,
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

    const notification = await notificationService.createNotification(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification",
      entityId: notification.id,
      action: "create",
      metadata: notificationAuditMetadata(notification),
    });

    if (notification.status === "sent") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "send",
        metadata: notificationAuditMetadata(notification),
      });
    }

    if (notification.status === "failed") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "notification",
        entityId: notification.id,
        action: "fail",
        metadata: notificationAuditMetadata(notification),
      });
    }

    return jsonSuccess({ notification }, 201);
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}

export async function handleListNotifications(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listNotificationsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:read",
    );

    const result = await notificationService.listNotifications(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}

export async function handleGetNotification(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = notificationIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:read",
    );

    const notification = await notificationService.getNotification(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ notification });
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}
