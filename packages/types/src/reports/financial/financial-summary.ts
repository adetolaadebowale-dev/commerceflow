import type { ReportFilter } from "../report-foundation";
import type {
  DiscountSummary,
  FinancialMetrics,
  InvoiceSummary,
  PaymentSummary,
  RefundSummary,
  ShippingRevenueSummary,
  TaxSummary,
} from "./financial-metrics";

/** Comprehensive financial summary with dimensional breakdowns. */
export interface FinancialSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly metrics: FinancialMetrics;
  readonly paymentSummary: PaymentSummary;
  readonly invoiceSummary: InvoiceSummary;
  readonly refundSummary: RefundSummary;
  readonly taxSummary: TaxSummary;
  readonly discountSummary: DiscountSummary;
  readonly shippingRevenueSummary: ShippingRevenueSummary;
}
