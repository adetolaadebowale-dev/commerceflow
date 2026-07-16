import type { ReportFilter } from "../report-foundation";
import type {
  FulfillmentAnalytics,
  ProcurementMetrics,
  ReceivingAnalytics,
  ReplenishmentMetrics,
  TransferAnalytics,
} from "./procurement-metrics";
import type { PurchaseOrderAnalyticsSummary } from "./procurement-metrics";
import type { SupplierAnalyticsSummary } from "./procurement-metrics";
import type { WarehouseAnalyticsSummary } from "./procurement-metrics";

/** Comprehensive procurement and warehouse analytics summary. */
export interface ProcurementSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly metrics: ProcurementMetrics;
  readonly purchaseOrderAnalytics: PurchaseOrderAnalyticsSummary;
  readonly supplierPerformance: SupplierAnalyticsSummary;
  readonly warehousePerformance: WarehouseAnalyticsSummary;
  readonly transferAnalytics: TransferAnalytics;
  readonly replenishmentAnalytics: ReplenishmentMetrics;
  readonly receivingAnalytics: ReceivingAnalytics;
  readonly fulfillmentAnalytics: FulfillmentAnalytics;
}
