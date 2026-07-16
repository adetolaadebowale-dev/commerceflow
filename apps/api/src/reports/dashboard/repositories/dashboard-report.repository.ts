import type {
  CustomerSummary,
  FinancialSummary,
  InventorySummary,
  ProcurementSummary,
  SalesSummary,
} from "@commerceflow/types";
import type { ExecutiveDashboardQuery } from "@commerceflow/validation";

/** Source summaries loaded from existing domain reporting modules. */
export interface DashboardSourceSummaries {
  readonly sales: SalesSummary;
  readonly financial: FinancialSummary;
  readonly inventory: InventorySummary;
  readonly customers: CustomerSummary;
  readonly procurement: ProcurementSummary;
}

export interface DashboardReportRepository {
  loadSourceSummaries(
    query: ExecutiveDashboardQuery,
  ): Promise<DashboardSourceSummaries>;
}
