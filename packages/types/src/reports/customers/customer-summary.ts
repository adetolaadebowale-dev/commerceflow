import type { ReportFilter } from "../report-foundation";
import type {
  CustomerGeographicDistributionRow,
  CustomerMetrics,
  CustomerNewVsReturningBreakdown,
  CustomerPurchaseFrequencyBand,
} from "./customer-metrics";

/** Comprehensive customer analytics summary with dimensional breakdowns. */
export interface CustomerSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly metrics: CustomerMetrics;
  readonly newVsReturning: CustomerNewVsReturningBreakdown;
  readonly purchaseFrequency: readonly CustomerPurchaseFrequencyBand[];
  readonly geographicDistribution: readonly CustomerGeographicDistributionRow[];
}
