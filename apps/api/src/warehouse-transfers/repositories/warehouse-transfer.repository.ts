import type {
  CatalogueListResult,
  WarehouseTransfer,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
} from "@commerceflow/types";
import type { ListWarehouseTransfersQuery } from "@commerceflow/validation";

export interface CreateWarehouseTransferItemRecord {
  readonly inventoryItemId: string;
  readonly quantity: number;
}

export interface CreateWarehouseTransferRecord {
  readonly storeId: string;
  readonly transferNumber: string;
  readonly sourceWarehouseId: string;
  readonly destinationWarehouseId: string;
  readonly notes?: string;
  readonly items: readonly CreateWarehouseTransferItemRecord[];
}

export interface WarehouseTransferRepository {
  findById(storeId: string, id: string): Promise<WarehouseTransfer | null>;
  list(
    query: ListWarehouseTransfersQuery,
  ): Promise<CatalogueListResult<WarehouseTransfer>>;
  create(record: CreateWarehouseTransferRecord): Promise<WarehouseTransfer>;
  approveWarehouseTransfer(
    storeId: string,
    id: string,
    approvedAt: Date,
  ): Promise<WarehouseTransfer>;
  shipWarehouseTransfer(
    storeId: string,
    id: string,
    shippedAt: Date,
  ): Promise<WarehouseTransferShipResult>;
  receiveWarehouseTransfer(
    storeId: string,
    id: string,
    receivedAt: Date,
  ): Promise<WarehouseTransferReceiveResult>;
  cancelWarehouseTransfer(
    storeId: string,
    id: string,
  ): Promise<WarehouseTransfer>;
}
