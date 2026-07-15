import type { StockMovement } from "../stock-movement/stock-movement";
import type { WarehouseTransferStatus } from "./warehouse-transfer-status";

/** Line item on a warehouse transfer. */
export interface WarehouseTransferItem {
  readonly id: string;
  readonly warehouseTransferId: string;
  readonly inventoryItemId: string;
  readonly quantity: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Store-scoped internal transfer between warehouses. */
export interface WarehouseTransfer {
  readonly id: string;
  readonly storeId: string;
  readonly transferNumber: string;
  readonly sourceWarehouseId: string;
  readonly destinationWarehouseId: string;
  readonly status: WarehouseTransferStatus;
  readonly notes?: string;
  readonly approvedAt?: string;
  readonly shippedAt?: string;
  readonly receivedAt?: string;
  readonly items: readonly WarehouseTransferItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Result of shipping a warehouse transfer with outbound stock movements. */
export interface WarehouseTransferShipResult {
  readonly warehouseTransfer: WarehouseTransfer;
  readonly stockMovements: readonly StockMovement[];
}

/** Result of receiving a warehouse transfer with inbound stock movements. */
export interface WarehouseTransferReceiveResult {
  readonly warehouseTransfer: WarehouseTransfer;
  readonly stockMovements: readonly StockMovement[];
}
