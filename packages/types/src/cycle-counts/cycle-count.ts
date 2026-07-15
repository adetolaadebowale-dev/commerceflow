import type { CycleCountStatus } from "./cycle-count-status";
import type { InventoryAdjustment } from "../inventory-adjustments/inventory-adjustment";
import type { StockMovement } from "../stock-movement/stock-movement";

/** Line item belonging to a cycle count session. */
export interface CycleCountItem {
  readonly id: string;
  readonly cycleCountId: string;
  readonly inventoryItemId: string;
  readonly expectedQuantity: number;
  readonly countedQuantity: number;
  readonly variance: number;
  readonly adjustmentId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Store-scoped physical inventory cycle count session. */
export interface CycleCount {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly cycleCountNumber: string;
  readonly status: CycleCountStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly items: readonly CycleCountItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Result of approving a cycle count with generated adjustments. */
export interface CycleCountApprovalResult {
  readonly cycleCount: CycleCount;
  readonly adjustments: readonly InventoryAdjustment[];
  readonly stockMovements: readonly StockMovement[];
}
