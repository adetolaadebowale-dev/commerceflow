import type {
  CatalogueListResult,
  OrderFulfillmentResult,
  ShipmentFulfillmentResult,
  StockMovement,
} from "@commerceflow/types";
import type {
  CreateFulfillmentInput,
  ListInventoryItemStockMovementsQuery,
  OrderFulfillmentActionQuery,
  StockMovementIdQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params:
    | OrderFulfillmentActionQuery
    | CreateFulfillmentInput
    | StockMovementIdQuery
    | ListInventoryItemStockMovementsQuery,
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

export type FulfillOrderRequest = OrderFulfillmentActionQuery;
export type FulfillOrderResponse = ApiSuccessResponse<OrderFulfillmentResult>;
export type FulfillShipmentRequest = CreateFulfillmentInput;
export type FulfillShipmentResponse = ApiSuccessResponse<{
  result: ShipmentFulfillmentResult;
}>;
export type ListInventoryItemStockMovementsParams =
  ListInventoryItemStockMovementsQuery;
export type ListInventoryItemStockMovementsResponse = ApiSuccessResponse<
  CatalogueListResult<StockMovement>
>;
export type GetStockMovementParams = StockMovementIdQuery;
export type GetStockMovementResponse = ApiSuccessResponse<{
  stockMovement: StockMovement;
}>;

export interface FulfillmentClient {
  fulfillOrder(
    orderId: string,
    params: FulfillOrderRequest,
  ): Promise<FulfillOrderResponse["data"]>;
  fulfillShipment(
    shipmentId: string,
    params: FulfillShipmentRequest,
  ): Promise<FulfillShipmentResponse["data"]>;
  listStockMovements(
    inventoryItemId: string,
    params: ListInventoryItemStockMovementsParams,
  ): Promise<ListInventoryItemStockMovementsResponse["data"]>;
  getStockMovement(
    id: string,
    params: GetStockMovementParams,
  ): Promise<GetStockMovementResponse["data"]>;
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

    fulfillShipment: (shipmentId, params) =>
      apiRequest<FulfillShipmentResponse["data"]>(config, {
        method: "POST",
        path: `/api/shipments/${shipmentId}/fulfill${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listStockMovements: (inventoryItemId, params) =>
      apiRequest<ListInventoryItemStockMovementsResponse["data"]>(config, {
        method: "GET",
        path: `/api/inventory-items/${inventoryItemId}/stock-movements${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getStockMovement: (id, params) =>
      apiRequest<GetStockMovementResponse["data"]>(config, {
        method: "GET",
        path: `/api/stock-movements/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
