import type {
  InvoiceReportRow,
  PaymentReportRow,
  RefundReportRow,
} from "@commerceflow/types";

import type {
  InvoiceFact,
  PaymentFact,
  RefundFact,
} from "../repositories/financial-report.repository";

export function mapInvoiceFactToReportRow(fact: InvoiceFact): InvoiceReportRow {
  return {
    invoiceId: fact.invoiceId,
    orderId: fact.orderId,
    orderNumber: fact.orderNumber,
    invoiceNumber: fact.invoiceNumber,
    status: fact.status,
    subtotal: fact.subtotal,
    discountAmount: fact.discountAmount,
    taxAmount: fact.taxAmount,
    shippingAmount: fact.shippingAmount,
    total: fact.total,
    currency: fact.currency,
    reportTimestamp: fact.reportTimestamp,
    issuedAt: fact.issuedAt,
    paidAt: fact.paidAt,
    createdAt: fact.createdAt,
  };
}

export function mapPaymentFactToReportRow(fact: PaymentFact): PaymentReportRow {
  return {
    paymentId: fact.paymentId,
    orderId: fact.orderId,
    orderNumber: fact.orderNumber,
    amount: fact.amount,
    currency: fact.currency,
    status: fact.status,
    provider: fact.provider,
    reference: fact.reference,
    reportTimestamp: fact.reportTimestamp,
    createdAt: fact.createdAt,
  };
}

export function mapRefundFactToReportRow(fact: RefundFact): RefundReportRow {
  return {
    refundId: fact.refundId,
    paymentId: fact.paymentId,
    orderId: fact.orderId,
    orderNumber: fact.orderNumber,
    amount: fact.amount,
    currency: fact.currency,
    status: fact.status,
    reason: fact.reason,
    reportTimestamp: fact.reportTimestamp,
    completedAt: fact.completedAt,
    createdAt: fact.createdAt,
  };
}
