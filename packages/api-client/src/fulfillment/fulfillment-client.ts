import type {
  FulfillOrderRequest,
  FulfillOrderResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: FulfillOrderRequest): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface FulfillmentClient {
  fulfillOrder(
    orderId: string,
    params: FulfillOrderRequest,
  ): Promise<FulfillOrderResponse["data"]>;
}

export function createFulfillmentClient(
  config: ApiClientConfig,
): FulfillmentClient {
  return {
    fulfillOrder: (orderId, params) =>
      apiRequest<FulfillOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/fulfill${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
