import type { ReportFilter } from "../report-foundation";
import type { SalesFinancialMetrics } from "./sales-metrics";

export type SalesTimelineGranularity = "day" | "week" | "month";

/** Single timeline bucket with financial metrics for a reporting period. */
export interface SalesTimelinePoint {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly periodLabel: string;
  readonly granularity: SalesTimelineGranularity;
  readonly metrics: SalesFinancialMetrics;
}

/** Timeline report with configurable period granularity. */
export interface SalesTimelineReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly granularity: SalesTimelineGranularity;
  readonly filter: ReportFilter;
  readonly points: readonly SalesTimelinePoint[];
}
