import type { ExecutiveDashboard, DashboardKPIReport } from "@commerceflow/types";

import type { DashboardSourceSummaries } from "../repositories/dashboard-report.repository";
import { buildDashboardSections, buildExecutiveSummary } from "../services/dashboard-aggregation";

export function mapSourceSummariesToExecutiveDashboard(input: {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ExecutiveDashboard["filter"];
  readonly summaries: DashboardSourceSummaries;
}): ExecutiveDashboard {
  const executiveSummary = buildExecutiveSummary(input.summaries);

  return {
    storeId: input.storeId,
    generatedAt: input.generatedAt,
    timezone: input.timezone,
    filter: input.filter,
    executiveSummary,
    sections: buildDashboardSections(input.summaries, executiveSummary),
  };
}

export function mapExecutiveDashboardToKPIReport(
  dashboard: ExecutiveDashboard,
  items: DashboardKPIReport["items"],
  pagination: DashboardKPIReport["pagination"],
): DashboardKPIReport {
  return {
    storeId: dashboard.storeId,
    generatedAt: dashboard.generatedAt,
    timezone: dashboard.timezone,
    filter: dashboard.filter,
    executiveSummary: dashboard.executiveSummary,
    items,
    pagination,
  };
}
