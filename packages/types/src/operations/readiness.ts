import type { IntegrityCheckResult } from "./integrity";

/** Overall operational readiness outcome for Phase 3 go-live assessment. */
export type ReadinessStatus = "READY" | "WARNING" | "FAILED";

/** Base health section shared across operational domains. */
export interface ReadinessHealthSection {
  readonly status: ReadinessStatus;
  readonly issueCount: number;
  readonly warningCount: number;
}

export interface WarehouseReadinessHealth extends ReadinessHealthSection {
  readonly warehouseCount: number;
  readonly activeWarehouseCount: number;
  readonly inTransitTransferCount: number;
  readonly pendingTransferCount: number;
}

export interface InventoryReadinessHealth extends ReadinessHealthSection {
  readonly inventoryItemCount: number;
  readonly lowStockItemCount: number;
  readonly negativeQuantityItemCount: number;
  readonly activeReservationCount: number;
  readonly openCycleCountCount: number;
}

export interface FulfillmentReadinessHealth extends ReadinessHealthSection {
  readonly pendingShipmentCount: number;
  readonly packedShipmentCount: number;
  readonly openAllocationCount: number;
  readonly activePickListCount: number;
}

export interface ProcurementReadinessHealth extends ReadinessHealthSection {
  readonly activeSupplierCount: number;
  readonly draftPurchaseOrderCount: number;
  readonly pendingPurchaseOrderCount: number;
}

export interface ShipmentReadinessHealth extends ReadinessHealthSection {
  readonly activeShipmentCount: number;
  readonly inTransitShipmentCount: number;
  readonly deliveredShipmentCount: number;
}

export interface ReturnReadinessHealth extends ReadinessHealthSection {
  readonly openReturnCount: number;
  readonly completedReturnCount: number;
  readonly pendingInspectionCount: number;
}

export interface ReplenishmentReadinessHealth extends ReadinessHealthSection {
  readonly pendingRecommendationCount: number;
  readonly activeReplenishmentRuleCount: number;
  readonly staleRecommendationCount: number;
}

/** Consolidated Phase 3 operational readiness report. */
export interface Phase3ReadinessReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly overallStatus: ReadinessStatus;
  readonly validation: IntegrityCheckResult;
  readonly warehouseHealth: WarehouseReadinessHealth;
  readonly inventoryHealth: InventoryReadinessHealth;
  readonly fulfillmentHealth: FulfillmentReadinessHealth;
  readonly procurementHealth: ProcurementReadinessHealth;
  readonly shipmentHealth: ShipmentReadinessHealth;
  readonly returnHealth: ReturnReadinessHealth;
  readonly replenishmentHealth: ReplenishmentReadinessHealth;
}

/** Result of an explicit Phase 3 validation run. */
export interface Phase3ValidationResult extends IntegrityCheckResult {
  readonly overallStatus: ReadinessStatus;
}
