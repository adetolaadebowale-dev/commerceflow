import type { InvoiceStatus } from "../../invoices/invoice-status";
import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { InvoiceSummary } from "./financial-metrics";

/** Single invoice row in the financial invoices report. */
export interface InvoiceReportRow {
  readonly invoiceId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly subtotal: string;
  readonly discountAmount: string;
  readonly taxAmount: string;
  readonly shippingAmount: string;
  readonly total: string;
  readonly currency: string;
  readonly reportTimestamp: string;
  readonly issuedAt?: string;
  readonly paidAt?: string;
  readonly createdAt: string;
}

/** Paginated invoice report with summary totals. */
export interface InvoiceReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly summary: InvoiceSummary;
  readonly items: readonly InvoiceReportRow[];
  readonly pagination: ReportPagination;
}
