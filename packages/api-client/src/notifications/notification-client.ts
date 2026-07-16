import type {
  CreateNotificationRequest,
  CreateNotificationResponse,
  GetNotificationResponse,
  ListNotificationsParams,
  ListNotificationsResponse,
  NotificationStoreScopedParams,
} from "./contracts";
import type {
  GetInAppNotificationParams,
  GetInAppNotificationResponse,
  ListInAppNotificationsParams,
  ListInAppNotificationsResponse,
  MarkInAppNotificationReadParams,
  MarkInAppNotificationReadResponse,
  MarkInAppNotificationUnreadParams,
  MarkInAppNotificationUnreadResponse,
} from "./in-app/contracts";
import type {
  SendTestEmailNotificationRequest,
  SendTestEmailNotificationResponse,
} from "./email/contracts";
import type {
  SendTestSmsNotificationRequest,
  SendTestSmsNotificationResponse,
} from "./sms/contracts";
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

function toInAppQueryString(
  params: ListInAppNotificationsParams | GetInAppNotificationParams,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("userId", params.userId);

  if ("page" in params) {
    searchParams.set("page", String(params.page));
    searchParams.set("limit", String(params.limit));

    if (params.unreadOnly) {
      searchParams.set("unreadOnly", "true");
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface NotificationClient {
  createNotification(
    input: CreateNotificationRequest,
  ): Promise<CreateNotificationResponse["data"]>;
  sendTestEmailNotification(
    input: SendTestEmailNotificationRequest,
  ): Promise<SendTestEmailNotificationResponse["data"]>;
  sendTestSmsNotification(
    input: SendTestSmsNotificationRequest,
  ): Promise<SendTestSmsNotificationResponse["data"]>;
  listNotifications(
    params: ListNotificationsParams,
  ): Promise<ListNotificationsResponse["data"]>;
  getNotification(
    id: string,
    params: NotificationStoreScopedParams,
  ): Promise<GetNotificationResponse["data"]>;
  listInAppNotifications(
    params: ListInAppNotificationsParams,
  ): Promise<ListInAppNotificationsResponse["data"]>;
  getInAppNotification(
    id: string,
    params: GetInAppNotificationParams,
  ): Promise<GetInAppNotificationResponse["data"]>;
  markInAppNotificationRead(
    id: string,
    params: MarkInAppNotificationReadParams,
  ): Promise<MarkInAppNotificationReadResponse["data"]>;
  markInAppNotificationUnread(
    id: string,
    params: MarkInAppNotificationUnreadParams,
  ): Promise<MarkInAppNotificationUnreadResponse["data"]>;
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

    sendTestEmailNotification: (input) =>
      apiRequest<SendTestEmailNotificationResponse["data"]>(config, {
        method: "POST",
        path: "/api/notifications/email/test",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    sendTestSmsNotification: (input) =>
      apiRequest<SendTestSmsNotificationResponse["data"]>(config, {
        method: "POST",
        path: "/api/notifications/sms/test",
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

    listInAppNotifications: (params) =>
      apiRequest<ListInAppNotificationsResponse["data"]>(config, {
        method: "GET",
        path: `/api/notifications/in-app${toInAppQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getInAppNotification: (id, params) =>
      apiRequest<GetInAppNotificationResponse["data"]>(config, {
        method: "GET",
        path: `/api/notifications/in-app/${id}${toInAppQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    markInAppNotificationRead: (id, params) =>
      apiRequest<MarkInAppNotificationReadResponse["data"]>(config, {
        method: "POST",
        path: `/api/notifications/in-app/${id}/read${toInAppQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    markInAppNotificationUnread: (id, params) =>
      apiRequest<MarkInAppNotificationUnreadResponse["data"]>(config, {
        method: "POST",
        path: `/api/notifications/in-app/${id}/unread${toInAppQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
