import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { WarehouseAnalyticsSummary } from "./procurement-metrics";

/** Warehouse performance row in procurement analytics. */
export interface WarehouseAnalyticsRow {
  readonly warehouseId: string;
  readonly warehouseName: string;
  readonly warehouseCode: string;
  readonly throughput: number;
  readonly inventoryTurnover: string;
  readonly transferVolume: number;
  readonly purchaseOrderCount: number;
  readonly fulfillmentVolume: number;
  readonly reportTimestamp: string;
}

/** Paginated warehouse performance analytics report. */
export interface WarehouseAnalytics {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: WarehouseAnalyticsSummary;
  readonly items: readonly WarehouseAnalyticsRow[];
  readonly pagination: ReportPagination;
}
