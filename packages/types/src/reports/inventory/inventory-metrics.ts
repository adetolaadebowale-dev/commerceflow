/** Aggregated inventory quantity and value metrics. */
export interface InventoryMetrics {
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAllocated: number;
  readonly quantityAvailable: number;
  readonly quantityIncoming: number;
  readonly quantityOutgoing: number;
  readonly inventoryValue: string;
  readonly stockMovementTotal: number;
  readonly adjustmentTotal: number;
  readonly currency: string;
}

/** Per-warehouse inventory breakdown. */
export interface InventoryWarehouseReport {
  readonly warehouseId: string;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAllocated: number;
  readonly quantityAvailable: number;
  readonly quantityIncoming: number;
  readonly quantityOutgoing: number;
  readonly inventoryValue: string;
  readonly itemCount: number;
}

/** Per product variant inventory breakdown within a warehouse. */
export interface InventoryVariantReport {
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAllocated: number;
  readonly quantityAvailable: number;
  readonly quantityIncoming: number;
  readonly quantityOutgoing: number;
  readonly inventoryValue: string;
}

/** Summary of adjustment movements in the reporting window. */
export interface InventoryAdjustmentSummary {
  readonly adjustmentCount: number;
  readonly netAdjustmentQuantity: number;
  readonly positiveAdjustmentQuantity: number;
  readonly negativeAdjustmentQuantity: number;
}
