import type { DashboardKPI, DashboardSectionKey } from "./dashboard-kpi";

/** Grouped KPI tiles for a dashboard domain area. */
export interface DashboardSection {
  readonly key: DashboardSectionKey;
  readonly title: string;
  readonly kpis: readonly DashboardKPI[];
}
