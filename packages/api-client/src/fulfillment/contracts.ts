import type { OrderFulfillmentResult } from "@commerceflow/types";
import type { OrderFulfillmentActionQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /orders/:id/fulfill */
export type FulfillOrderRequest = OrderFulfillmentActionQuery;
export type FulfillOrderResponse = ApiSuccessResponse<OrderFulfillmentResult>;

export type { OrderFulfillmentActionQuery };
