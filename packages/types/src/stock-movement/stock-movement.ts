import type { StockMovementType } from "./stock-movement-type";

/** Immutable ledger entry for a physical inventory quantity change. */
export interface StockMovement {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly inventoryItemId: string;
  readonly shipmentId?: string;
  readonly inventoryAllocationId?: string;
  readonly movementType: StockMovementType;
  readonly quantity: number;
  readonly previousQuantityOnHand: number;
  readonly newQuantityOnHand: number;
  readonly reference?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
}
