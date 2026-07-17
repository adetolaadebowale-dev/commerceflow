import type {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
} from "@commerceflow/types";
import type {
  CreateWebhookInput,
  ListWebhookDeliveriesQuery,
  ListWebhooksQuery,
  UpdateWebhookInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type CreateWebhookRequest = CreateWebhookInput;
export type CreateWebhookResponse = ApiSuccessResponse<{
  webhook: WebhookEndpointWithSecret;
}>;

export type ListWebhooksParams = ListWebhooksQuery;
export type ListWebhooksResponse = ApiSuccessResponse<{
  items: readonly WebhookEndpoint[];
  total: number;
  page: number;
  limit: number;
}>;

export type GetWebhookParams = { storeId: string };
export type GetWebhookResponse = ApiSuccessResponse<{ webhook: WebhookEndpoint }>;

export type UpdateWebhookRequest = UpdateWebhookInput;
export type UpdateWebhookResponse = ApiSuccessResponse<{ webhook: WebhookEndpoint }>;

export type ListWebhookDeliveriesParams = ListWebhookDeliveriesQuery;
export type ListWebhookDeliveriesResponse = ApiSuccessResponse<{
  items: readonly WebhookDelivery[];
  total: number;
  page: number;
  limit: number;
}>;
