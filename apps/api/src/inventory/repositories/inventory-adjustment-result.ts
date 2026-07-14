import type { InventoryItem, StockMovement } from "@commerceflow/types";

export interface InventoryAdjustmentResult {
  readonly inventoryItem: InventoryItem;
  readonly stockMovement: StockMovement;
}
