import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersParams,
  ListOrdersResponse,
  StoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListOrdersParams | StoreScopedParams,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface OrderClient {
  createOrder(input: CreateOrderRequest): Promise<CreateOrderResponse["data"]>;
  getOrder(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetOrderResponse["data"]>;
  listOrders(params: ListOrdersParams): Promise<ListOrdersResponse["data"]>;
}

export function createOrderClient(config: ApiClientConfig): OrderClient {
  return {
    createOrder: (input) =>
      apiRequest<CreateOrderResponse["data"]>(config, {
        method: "POST",
        path: "/api/orders",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getOrder: (id, params) =>
      apiRequest<GetOrderResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listOrders: (params) =>
      apiRequest<ListOrdersResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
