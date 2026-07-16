import type { PaymentProvider, PaymentStatus } from "../../payments";
import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { PaymentSummary } from "./financial-metrics";

/** Single payment row in the financial payments report. */
export interface PaymentReportRow {
  readonly paymentId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: PaymentProvider;
  readonly reference: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Paginated payment report with summary totals. */
export interface PaymentReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: PaymentSummary;
  readonly items: readonly PaymentReportRow[];
  readonly pagination: ReportPagination;
}
