import type { InventoryItem } from "../inventory/inventory-item";
import type { StockMovement } from "../stock-movement/stock-movement";
import type { Return } from "./return";

/** Result of completing a warehouse return with optional restock movements. */
export interface ReturnCompletionResult {
  readonly return: Return;
  readonly stockMovements: readonly StockMovement[];
  readonly inventoryItems: readonly InventoryItem[];
}
