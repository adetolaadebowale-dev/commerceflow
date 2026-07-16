import type { RefundStatus } from "../../refunds/refund-status";
import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { RefundSummary } from "./financial-metrics";

/** Single refund row in the financial refunds report. */
export interface RefundReportRow {
  readonly refundId: string;
  readonly paymentId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: RefundStatus;
  readonly reason: string;
  readonly reportTimestamp: string;
  readonly completedAt?: string;
  readonly createdAt: string;
}

/** Paginated refund report with summary totals. */
export interface RefundReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: RefundSummary;
  readonly items: readonly RefundReportRow[];
  readonly pagination: ReportPagination;
}
