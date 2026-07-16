import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { SupplierAnalyticsSummary } from "./procurement-metrics";

/** Supplier performance row in procurement analytics. */
export interface SupplierAnalyticsRow {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly supplierCode: string;
  readonly purchaseOrderCount: number;
  readonly purchaseVolume: string;
  readonly onTimeReceivingRate: string;
  readonly currency: string;
  readonly reportTimestamp: string;
}

/** Paginated supplier performance analytics report. */
export interface SupplierAnalytics {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: SupplierAnalyticsSummary;
  readonly items: readonly SupplierAnalyticsRow[];
  readonly pagination: ReportPagination;
}
