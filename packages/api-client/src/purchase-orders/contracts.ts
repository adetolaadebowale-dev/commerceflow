import type {
  CatalogueListResult,
  PurchaseOrder,
  PurchaseOrderReceiveResult,
} from "@commerceflow/types";
import type {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  PurchaseOrderLifecycleInput,
  ReceivePurchaseOrderInput,
} from "@commerceflow/validation";
import type { ApiSuccessResponse } from "../common/api-response";

export type CreatePurchaseOrderRequest = CreatePurchaseOrderInput;
export type CreatePurchaseOrderResponse = ApiSuccessResponse<{
  purchaseOrder: PurchaseOrder;
}>;

export type GetPurchaseOrderResponse = ApiSuccessResponse<{
  purchaseOrder: PurchaseOrder;
}>;

export type ListPurchaseOrdersParams = ListPurchaseOrdersQuery;
export type ListPurchaseOrdersResponse = ApiSuccessResponse<
  CatalogueListResult<PurchaseOrder>
>;

export type ApprovePurchaseOrderRequest = PurchaseOrderLifecycleInput;
export type ApprovePurchaseOrderResponse = ApiSuccessResponse<{
  purchaseOrder: PurchaseOrder;
}>;

export type OrderPurchaseOrderRequest = PurchaseOrderLifecycleInput;
export type OrderPurchaseOrderResponse = ApiSuccessResponse<{
  purchaseOrder: PurchaseOrder;
}>;

export type ReceivePurchaseOrderRequest = ReceivePurchaseOrderInput;
export type ReceivePurchaseOrderResponse = ApiSuccessResponse<{
  result: PurchaseOrderReceiveResult;
}>;

export type CancelPurchaseOrderRequest = PurchaseOrderLifecycleInput;
export type CancelPurchaseOrderResponse = ApiSuccessResponse<{
  purchaseOrder: PurchaseOrder;
}>;

export type PurchaseOrderStoreScopedParams = Pick<
  ListPurchaseOrdersQuery,
  "storeId"
>;
