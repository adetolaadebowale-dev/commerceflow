import type {
  CreateWebhookRequest,
  CreateWebhookResponse,
  GetWebhookParams,
  GetWebhookResponse,
  ListWebhookDeliveriesParams,
  ListWebhookDeliveriesResponse,
  ListWebhooksParams,
  ListWebhooksResponse,
  UpdateWebhookRequest,
  UpdateWebhookResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreScopedQueryString(params: { storeId: string }): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(
  params: ListWebhooksParams | ListWebhookDeliveriesParams,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface WebhooksClient {
  createWebhook(
    input: CreateWebhookRequest,
  ): Promise<CreateWebhookResponse["data"]>;
  listWebhooks(params: ListWebhooksParams): Promise<ListWebhooksResponse["data"]>;
  getWebhook(
    id: string,
    params: GetWebhookParams,
  ): Promise<GetWebhookResponse["data"]>;
  updateWebhook(
    id: string,
    params: GetWebhookParams,
    input: UpdateWebhookRequest,
  ): Promise<UpdateWebhookResponse["data"]>;
  listWebhookDeliveries(
    id: string,
    params: ListWebhookDeliveriesParams,
  ): Promise<ListWebhookDeliveriesResponse["data"]>;
}

export function createWebhooksClient(config: ApiClientConfig): WebhooksClient {
  return {
    createWebhook: (input) =>
      apiRequest<CreateWebhookResponse["data"]>(config, {
        method: "POST",
        path: "/api/webhooks",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listWebhooks: (params) =>
      apiRequest<ListWebhooksResponse["data"]>(config, {
        method: "GET",
        path: `/api/webhooks${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getWebhook: (id, params) =>
      apiRequest<GetWebhookResponse["data"]>(config, {
        method: "GET",
        path: `/api/webhooks/${id}${toStoreScopedQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateWebhook: (id, params, input) =>
      apiRequest<UpdateWebhookResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/webhooks/${id}${toStoreScopedQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listWebhookDeliveries: (id, params) =>
      apiRequest<ListWebhookDeliveriesResponse["data"]>(config, {
        method: "GET",
        path: `/api/webhooks/${id}/deliveries${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
