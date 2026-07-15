import type {
  CatalogueListResult,
  WarehouseTransfer,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
} from "@commerceflow/types";
import type {
  CreateWarehouseTransferInput,
  ListWarehouseTransfersQuery,
  WarehouseTransferLifecycleInput,
} from "@commerceflow/validation";
import type { ApiSuccessResponse } from "../common/api-response";

/** POST /warehouse-transfers */
export type CreateWarehouseTransferRequest = CreateWarehouseTransferInput;
export type CreateWarehouseTransferResponse = ApiSuccessResponse<{
  warehouseTransfer: WarehouseTransfer;
}>;

/** GET /warehouse-transfers/:id */
export type GetWarehouseTransferResponse = ApiSuccessResponse<{
  warehouseTransfer: WarehouseTransfer;
}>;

/** GET /warehouse-transfers */
export type ListWarehouseTransfersParams = ListWarehouseTransfersQuery;
export type ListWarehouseTransfersResponse = ApiSuccessResponse<
  CatalogueListResult<WarehouseTransfer>
>;

/** POST /warehouse-transfers/:id/approve */
export type ApproveWarehouseTransferRequest = WarehouseTransferLifecycleInput;
export type ApproveWarehouseTransferResponse = ApiSuccessResponse<{
  warehouseTransfer: WarehouseTransfer;
}>;

/** POST /warehouse-transfers/:id/ship */
export type ShipWarehouseTransferRequest = WarehouseTransferLifecycleInput;
export type ShipWarehouseTransferResponse = ApiSuccessResponse<{
  result: WarehouseTransferShipResult;
}>;

/** POST /warehouse-transfers/:id/receive */
export type ReceiveWarehouseTransferRequest = WarehouseTransferLifecycleInput;
export type ReceiveWarehouseTransferResponse = ApiSuccessResponse<{
  result: WarehouseTransferReceiveResult;
}>;

/** POST /warehouse-transfers/:id/cancel */
export type CancelWarehouseTransferRequest = WarehouseTransferLifecycleInput;
export type CancelWarehouseTransferResponse = ApiSuccessResponse<{
  warehouseTransfer: WarehouseTransfer;
}>;

export type WarehouseTransferStoreScopedParams = Pick<
  ListWarehouseTransfersQuery,
  "storeId"
>;
