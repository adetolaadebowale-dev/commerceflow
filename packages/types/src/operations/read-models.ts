/** Counts grouped by lifecycle status for dashboard widgets. */
export interface StatusCountSummary {
  readonly status: string;
  readonly count: number;
}

/** Warehouse-centric operational overview. */
export interface WarehouseOperationalSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly warehouseCount: number;
  readonly activeWarehouseCount: number;
  readonly inTransitTransferCount: number;
  readonly pendingTransferCount: number;
  readonly activeShipmentCount: number;
}

/** Fulfillment pipeline snapshot. */
export interface FulfillmentDashboard {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly shipmentsByStatus: readonly StatusCountSummary[];
  readonly pickListsByStatus: readonly StatusCountSummary[];
  readonly allocationsByStatus: readonly StatusCountSummary[];
  readonly pendingShipmentCount: number;
  readonly packedShipmentCount: number;
  readonly openAllocationCount: number;
}

/** Procurement and replenishment snapshot. */
export interface ProcurementDashboard {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly purchaseOrdersByStatus: readonly StatusCountSummary[];
  readonly pendingRecommendationCount: number;
  readonly activeReplenishmentRuleCount: number;
  readonly draftPurchaseOrderCount: number;
  readonly activeSupplierCount: number;
}

/** Inventory health indicators for warehouse operations. */
export interface InventoryHealthSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly inventoryItemCount: number;
  readonly lowStockItemCount: number;
  readonly negativeQuantityItemCount: number;
  readonly activeReservationCount: number;
  readonly openCycleCountCount: number;
  readonly pendingAdjustmentCount: number;
}
