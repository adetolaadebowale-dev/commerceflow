import type {
  FulfillmentDashboard,
  IntegrityCheckResult,
  InventoryHealthSummary,
  ProcurementDashboard,
  WarehouseOperationalSummary,
} from "@commerceflow/types";

export interface OperationsStoreScopedParams {
  readonly storeId: string;
}

export type GetWarehouseOperationalSummaryResponse = WarehouseOperationalSummary;
export type GetFulfillmentDashboardResponse = FulfillmentDashboard;
export type GetProcurementDashboardResponse = ProcurementDashboard;
export type GetInventoryHealthSummaryResponse = InventoryHealthSummary;
export type RunIntegrityCheckResponse = IntegrityCheckResult;
export type RunWarehouseValidationResponse = IntegrityCheckResult;
export type RunInventoryValidationResponse = IntegrityCheckResult;
