import {
  listNotificationPreferencesQuerySchema,
  notificationPreferenceTypeParamSchema,
  updateNotificationPreferenceSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  NOTIFICATION_PREFERENCE_ERROR_CODES,
  NotificationPreferenceError,
} from "../errors";
import { notificationPreferenceService } from "../services";
import {
  handleNotificationPreferenceRouteError,
  jsonSuccess,
} from "./http-response";
import { getQueryParams } from "./request-utils";

function preferenceAuditMetadata(preference: {
  notificationType: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}) {
  return {
    notificationType: preference.notificationType,
    emailEnabled: preference.emailEnabled,
    smsEnabled: preference.smsEnabled,
    inAppEnabled: preference.inAppEnabled,
  };
}

export async function handleListNotificationPreferences(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listNotificationPreferencesQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new NotificationPreferenceError(
        NOTIFICATION_PREFERENCE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "notifications:read",
    );

    const preferences = await notificationPreferenceService.listPreferences(
      parsed.data.storeId,
      authContext.userId,
    );

    return jsonSuccess({ preferences });
  } catch (error) {
    return handleNotificationPreferenceRouteError(error);
  }
}

export async function handleUpdateNotificationPreference(
  type: string,
  request: Request,
): Promise<Response> {
  try {
    const parsedType = notificationPreferenceTypeParamSchema.safeParse(type);

    if (!parsedType.success) {
      throw new NotificationPreferenceError(
        NOTIFICATION_PREFERENCE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsedType.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateNotificationPreferenceSchema.safeParse(body);

    if (!parsed.success) {
      throw new NotificationPreferenceError(
        NOTIFICATION_PREFERENCE_ERROR_CODES.VALIDATION_ERROR,
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

    const preference = await notificationPreferenceService.updatePreference(
      parsed.data.storeId,
      authContext.userId,
      parsedType.data,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "notification_preference",
      entityId: preference.id,
      action: "update",
      metadata: preferenceAuditMetadata(preference),
    });

    return jsonSuccess({ preference });
  } catch (error) {
    return handleNotificationPreferenceRouteError(error);
  }
}
