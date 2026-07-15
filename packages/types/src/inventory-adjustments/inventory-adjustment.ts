/** Immutable manual inventory adjustment record. */
export interface InventoryAdjustment {
  readonly id: string;
  readonly storeId: string;
  readonly inventoryItemId: string;
  readonly adjustmentNumber: string;
  readonly movementQuantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly previousQuantityOnHand: number;
  readonly newQuantityOnHand: number;
  readonly createdByUserId: string;
  readonly createdAt: string;
}

/** Adjustment creation result including stock movement. */
export interface InventoryAdjustmentResult {
  readonly adjustment: InventoryAdjustment;
  readonly stockMovement: import("../stock-movement/stock-movement").StockMovement;
}
