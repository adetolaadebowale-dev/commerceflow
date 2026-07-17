import type {
  NotificationPreference,
  NotificationPreferenceType,
  NotificationPreferenceView,
} from "@commerceflow/types";
import type {
  ListNotificationPreferencesQuery,
  UpdateNotificationPreferenceInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type ListNotificationPreferencesParams =
  ListNotificationPreferencesQuery;

export type UpdateNotificationPreferenceRequest =
  UpdateNotificationPreferenceInput;

export type ListNotificationPreferencesResponse = ApiSuccessResponse<{
  preferences: readonly NotificationPreferenceView[];
}>;

export type UpdateNotificationPreferenceResponse = ApiSuccessResponse<{
  preference: NotificationPreference;
}>;

export type { NotificationPreferenceType, NotificationPreferenceView };
