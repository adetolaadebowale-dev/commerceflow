import type {
  ListNotificationPreferencesParams,
  ListNotificationPreferencesResponse,
  UpdateNotificationPreferenceRequest,
  UpdateNotificationPreferenceResponse,
} from "./contracts";
import type { NotificationPreferenceType } from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: ListNotificationPreferencesParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface NotificationPreferenceClient {
  listNotificationPreferences(
    params: ListNotificationPreferencesParams,
  ): Promise<ListNotificationPreferencesResponse["data"]>;
  updateNotificationPreference(
    type: NotificationPreferenceType,
    input: UpdateNotificationPreferenceRequest,
  ): Promise<UpdateNotificationPreferenceResponse["data"]>;
}

export function createNotificationPreferenceClient(
  config: ApiClientConfig,
): NotificationPreferenceClient {
  return {
    listNotificationPreferences: (params) =>
      apiRequest<ListNotificationPreferencesResponse["data"]>(config, {
        method: "GET",
        path: `/api/notification-preferences${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateNotificationPreference: (type, input) =>
      apiRequest<UpdateNotificationPreferenceResponse["data"]>(config, {
        method: "PUT",
        path: `/api/notification-preferences/${type}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
