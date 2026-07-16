/** Core financial metrics from immutable order and payment snapshots. */
export interface FinancialMetrics {
  readonly grossRevenue: string;
  readonly netRevenue: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shippingRevenue: string;
  readonly refundTotals: string;
  readonly invoiceTotals: string;
  readonly paymentTotals: string;
  readonly outstandingInvoices: string;
  readonly collectionRate: string;
  readonly averagePaymentAmount: string;
  readonly currency: string;
}

/** Payment totals grouped by status. */
export interface PaymentSummary {
  readonly totalAmount: string;
  readonly paymentCount: number;
  readonly paidAmount: string;
  readonly paidCount: number;
  readonly authorizedAmount: string;
  readonly authorizedCount: number;
  readonly pendingAmount: string;
  readonly pendingCount: number;
  readonly failedAmount: string;
  readonly failedCount: number;
  readonly currency: string;
}

/** Invoice totals grouped by status. */
export interface InvoiceSummary {
  readonly totalAmount: string;
  readonly invoiceCount: number;
  readonly issuedAmount: string;
  readonly issuedCount: number;
  readonly paidAmount: string;
  readonly paidCount: number;
  readonly outstandingAmount: string;
  readonly outstandingCount: number;
  readonly voidAmount: string;
  readonly voidCount: number;
  readonly currency: string;
}

/** Refund totals grouped by status. */
export interface RefundSummary {
  readonly totalAmount: string;
  readonly refundCount: number;
  readonly completedAmount: string;
  readonly completedCount: number;
  readonly pendingAmount: string;
  readonly pendingCount: number;
  readonly currency: string;
}

/** Tax totals from revenue order snapshots. */
export interface TaxSummary {
  readonly totalTax: string;
  readonly orderCount: number;
  readonly currency: string;
}

/** Discount totals from revenue order snapshots. */
export interface DiscountSummary {
  readonly totalDiscount: string;
  readonly orderCount: number;
  readonly currency: string;
}

/** Shipping revenue totals from revenue order snapshots. */
export interface ShippingRevenueSummary {
  readonly totalShipping: string;
  readonly orderCount: number;
  readonly currency: string;
}
