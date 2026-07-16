import {
  inAppNotificationQuerySchema,
  listInAppNotificationsQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { handleNotificationRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams } from "../../routes/request-utils";
import { NOTIFICATION_ERROR_CODES, NotificationError } from "../../errors";
import { inAppNotificationService } from "../services";

function inAppAuditMetadata(notification: {
  id: string;
  userId: string;
  isRead: boolean;
}) {
  return {
    notificationId: notification.id,
    userId: notification.userId,
    isRead: notification.isRead,
  };
}

export async function handleListInAppNotifications(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listInAppNotificationsQuerySchema.safeParse(
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

    const result = await inAppNotificationService.listInAppNotifications(
      parsed.data,
    );

    return jsonSuccess(result);
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}

export async function handleGetInAppNotification(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inAppNotificationQuerySchema.safeParse(
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

    const notification = await inAppNotificationService.getInAppNotification(
      id,
      parsed.data,
    );

    return jsonSuccess({ notification });
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}

export async function handleMarkInAppNotificationRead(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inAppNotificationQuerySchema.safeParse(
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

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:write",
    );

    const notification = await inAppNotificationService.markAsRead(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "in_app_notification",
      entityId: notification.id,
      action: "read",
      metadata: inAppAuditMetadata(notification),
    });

    return jsonSuccess({ notification });
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}

export async function handleMarkInAppNotificationUnread(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inAppNotificationQuerySchema.safeParse(
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

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:write",
    );

    const notification = await inAppNotificationService.markAsUnread(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "in_app_notification",
      entityId: notification.id,
      action: "unread",
      metadata: inAppAuditMetadata(notification),
    });

    return jsonSuccess({ notification });
  } catch (error) {
    return handleNotificationRouteError(error);
  }
}
