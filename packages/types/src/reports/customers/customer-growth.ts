import type { ReportFilter } from "../report-foundation";

export type CustomerGrowthGranularity = "day" | "week" | "month";

/** Single growth bucket for a reporting period. */
export interface CustomerGrowthPoint {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly periodLabel: string;
  readonly granularity: CustomerGrowthGranularity;
  readonly totalCustomers: number;
  readonly newCustomers: number;
  readonly activeCustomers: number;
  readonly returningCustomers: number;
}

/** Customer growth report with configurable period granularity. */
export interface CustomerGrowthReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly granularity: CustomerGrowthGranularity;
  readonly filter: ReportFilter;
  readonly points: readonly CustomerGrowthPoint[];
}
