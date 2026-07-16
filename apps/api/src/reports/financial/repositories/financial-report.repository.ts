import type {
  InvoiceStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from "@commerceflow/types";

/** Read-only order financial fact derived from immutable order snapshots. */
export interface FinancialOrderFact {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly storeId: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: string;
  readonly warehouseId?: string;
  readonly currency: string;
  readonly subtotal: string;
  readonly discountAmount: string;
  readonly taxAmount: string;
  readonly shippingAmount: string;
  readonly total: string;
  readonly refundTotal: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly confirmedAt?: string;
}

/** Read-only invoice fact for financial reporting. */
export interface InvoiceFact {
  readonly invoiceId: string;
  readonly storeId: string;
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

/** Read-only payment fact for financial reporting. */
export interface PaymentFact {
  readonly paymentId: string;
  readonly storeId: string;
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

/** Read-only refund fact for financial reporting. */
export interface RefundFact {
  readonly refundId: string;
  readonly storeId: string;
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

export interface ListFinancialOrderFactsQuery {
  readonly storeId: string;
  readonly orderStatus?: OrderStatus;
  readonly currency?: string;
}

export interface ListInvoiceFactsQuery {
  readonly storeId: string;
  readonly currency?: string;
  readonly invoiceStatus?: InvoiceStatus;
}

export interface ListPaymentFactsQuery {
  readonly storeId: string;
  readonly currency?: string;
  readonly paymentStatus?: PaymentStatus;
}

export interface ListRefundFactsQuery {
  readonly storeId: string;
  readonly currency?: string;
}

export interface FinancialReportRepository {
  listOrderFacts(
    query: ListFinancialOrderFactsQuery,
  ): Promise<readonly FinancialOrderFact[]>;
  listInvoiceFacts(
    query: ListInvoiceFactsQuery,
  ): Promise<readonly InvoiceFact[]>;
  listPaymentFacts(
    query: ListPaymentFactsQuery,
  ): Promise<readonly PaymentFact[]>;
  listRefundFacts(
    query: ListRefundFactsQuery,
  ): Promise<readonly RefundFact[]>;
}
