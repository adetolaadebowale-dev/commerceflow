import type { CatalogueListResult, Order } from "@commerceflow/types";
import type { CreateOrderInput, ListOrdersQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /orders */
export type CreateOrderRequest = CreateOrderInput;
export type CreateOrderResponse = ApiSuccessResponse<{ order: Order }>;

/** GET /orders/:id */
export type GetOrderResponse = ApiSuccessResponse<{ order: Order }>;

/** GET /orders */
export type ListOrdersResponse = ApiSuccessResponse<CatalogueListResult<Order>>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListOrdersParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: Order["status"];
  readonly customerId?: string;
}

export type { CreateOrderInput, ListOrdersQuery };
