import type { StockMovementType } from "@commerceflow/types";

/** Read-only inventory snapshot fact for reporting. */
export interface InventoryItemFact {
  readonly inventoryItemId: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAllocated: number;
  readonly quantityAvailable: number;
  readonly quantityIncoming: number;
  readonly quantityOutgoing: number;
  readonly unitCost: string;
  readonly currency: string;
  readonly reorderPoint?: number;
  readonly reorderQuantity?: number;
  readonly supplierId?: string;
  readonly reportTimestamp: string;
}

/** Read-only stock movement fact for reporting. */
export interface InventoryMovementFact {
  readonly movementId: string;
  readonly storeId: string;
  readonly inventoryItemId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly movementType: StockMovementType;
  readonly quantity: number;
  readonly previousQuantityOnHand: number;
  readonly newQuantityOnHand: number;
  readonly reference?: string;
  readonly reportTimestamp: string;
}

export interface ListInventoryItemFactsQuery {
  readonly storeId: string;
  readonly warehouseId?: string;
  readonly productVariantId?: string;
}

export interface ListInventoryMovementFactsQuery {
  readonly storeId: string;
  readonly warehouseId?: string;
  readonly inventoryItemId?: string;
  readonly movementType?: StockMovementType;
}

export interface InventoryReportRepository {
  listItemFacts(
    query: ListInventoryItemFactsQuery,
  ): Promise<readonly InventoryItemFact[]>;
  listMovementFacts(
    query: ListInventoryMovementFactsQuery,
  ): Promise<readonly InventoryMovementFact[]>;
}
