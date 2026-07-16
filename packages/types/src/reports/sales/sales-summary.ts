import type { ReportFilter } from "../report-foundation";
import type {
  SalesFinancialMetrics,
  SalesPeriodBreakdown,
  SalesStatusBreakdown,
  SalesWarehouseBreakdown,
} from "./sales-metrics";

/** Comprehensive sales summary with dimensional breakdowns. */
export interface SalesSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly metrics: SalesFinancialMetrics;
  readonly byDay: readonly SalesPeriodBreakdown[];
  readonly byWeek: readonly SalesPeriodBreakdown[];
  readonly byMonth: readonly SalesPeriodBreakdown[];
  readonly byOrderStatus: readonly SalesStatusBreakdown[];
  readonly byPaymentStatus: readonly SalesStatusBreakdown[];
  readonly byStore: readonly SalesStatusBreakdown[];
  readonly byWarehouse: readonly SalesWarehouseBreakdown[];
}
