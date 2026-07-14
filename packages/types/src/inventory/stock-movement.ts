import type { StockMovementReason } from "./stock-movement-reason";

/**
 * Immutable ledger entry for an inventory quantity change.
 */
export interface StockMovement {
  readonly id: string;
  readonly storeId: string;
  readonly inventoryItemId: string;
  readonly productVariantId: string;
  readonly quantityChange: number;
  readonly quantityAfter: number;
  readonly reason: StockMovementReason;
  readonly createdAt: string;
}
