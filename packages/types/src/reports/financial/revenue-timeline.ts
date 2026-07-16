import type { ReportFilter } from "../report-foundation";

export type RevenueTimelineGranularity = "day" | "week" | "month";

/** Single revenue timeline bucket for a reporting period. */
export interface RevenueTimelinePoint {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly periodLabel: string;
  readonly granularity: RevenueTimelineGranularity;
  readonly grossRevenue: string;
  readonly netRevenue: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shippingRevenue: string;
  readonly refundTotals: string;
  readonly currency: string;
}

/** Revenue timeline report with configurable period granularity. */
export interface RevenueTimelineReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly granularity: RevenueTimelineGranularity;
  readonly filter: ReportFilter;
  readonly points: readonly RevenueTimelinePoint[];
}
