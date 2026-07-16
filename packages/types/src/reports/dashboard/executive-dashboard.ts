import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { DashboardKPI } from "./dashboard-kpi";
import type { DashboardSection } from "./dashboard-section";
import type { ExecutiveSummary } from "./executive-summary";

/** Unified executive dashboard consolidating all reporting modules. */
export interface ExecutiveDashboard {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly executiveSummary: ExecutiveSummary;
  readonly sections: readonly DashboardSection[];
}

/** Paginated flat KPI list derived from the executive dashboard. */
export interface DashboardKPIReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly executiveSummary: ExecutiveSummary;
  readonly items: readonly DashboardKPI[];
  readonly pagination: ReportPagination;
}
