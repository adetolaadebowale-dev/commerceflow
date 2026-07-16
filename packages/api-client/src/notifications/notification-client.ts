import type {
  CreateNotificationRequest,
  CreateNotificationResponse,
  GetNotificationResponse,
  ListNotificationsParams,
  ListNotificationsResponse,
  NotificationStoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: NotificationStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListNotificationsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.channel) {
    searchParams.set("channel", params.channel);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.userId) {
    searchParams.set("userId", params.userId);
  }

  if (params.customerId) {
    searchParams.set("customerId", params.customerId);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface NotificationClient {
  createNotification(
    input: CreateNotificationRequest,
  ): Promise<CreateNotificationResponse["data"]>;
  listNotifications(
    params: ListNotificationsParams,
  ): Promise<ListNotificationsResponse["data"]>;
  getNotification(
    id: string,
    params: NotificationStoreScopedParams,
  ): Promise<GetNotificationResponse["data"]>;
}

export function createNotificationClient(
  config: ApiClientConfig,
): NotificationClient {
  return {
    createNotification: (input) =>
      apiRequest<CreateNotificationResponse["data"]>(config, {
        method: "POST",
        path: "/api/notifications",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listNotifications: (params) =>
      apiRequest<ListNotificationsResponse["data"]>(config, {
        method: "GET",
        path: `/api/notifications${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getNotification: (id, params) =>
      apiRequest<GetNotificationResponse["data"]>(config, {
        method: "GET",
        path: `/api/notifications/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
