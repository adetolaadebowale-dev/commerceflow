import type {
  FulfillmentDashboard,
  IntegrityCheckResult,
  InventoryHealthSummary,
  Phase3ReadinessReport,
  Phase3ValidationResult,
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
export type GetReadinessReportResponse = Phase3ReadinessReport;
export type RunPhase3ValidationResponse = Phase3ValidationResult;
