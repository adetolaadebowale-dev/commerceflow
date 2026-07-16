import type { Invoice, Order, Payment, Refund } from "@commerceflow/types";

import { derivePaymentStatus } from "../../sales/mappers/sales-order-fact.mapper";
import type {
  FinancialOrderFact,
  InvoiceFact,
  PaymentFact,
  RefundFact,
} from "../repositories/financial-report.repository";

export function mapOrderToFinancialOrderFact(
  order: Order,
  payments: readonly Payment[],
  refundTotal: string,
  warehouseId?: string,
): FinancialOrderFact {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId: order.storeId,
    orderStatus: order.status,
    paymentStatus: derivePaymentStatus(payments),
    warehouseId,
    currency: order.currency,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? "0.00",
    taxAmount: order.taxAmount ?? "0.00",
    shippingAmount: order.shippingAmount ?? "0.00",
    total: order.total,
    refundTotal,
    reportTimestamp: order.confirmedAt ?? order.createdAt,
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
  };
}

export function mapInvoiceToFact(
  invoice: Invoice,
  orderNumber: string,
): InvoiceFact {
  return {
    invoiceId: invoice.id,
    storeId: invoice.storeId,
    orderId: invoice.orderId,
    orderNumber,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount ?? "0.00",
    taxAmount: invoice.taxAmount ?? "0.00",
    shippingAmount: invoice.shippingAmount ?? "0.00",
    total: invoice.total,
    currency: invoice.currency,
    reportTimestamp: invoice.issuedAt ?? invoice.paidAt ?? invoice.createdAt,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
  };
}

export function mapPaymentToFact(
  payment: Payment,
  orderNumber: string,
): PaymentFact {
  return {
    paymentId: payment.id,
    storeId: payment.storeId,
    orderId: payment.orderId,
    orderNumber,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    reference: payment.reference,
    reportTimestamp: payment.createdAt,
    createdAt: payment.createdAt,
  };
}

export function mapRefundToFact(
  refund: Refund,
  orderId: string,
  orderNumber: string,
): RefundFact {
  return {
    refundId: refund.id,
    storeId: refund.storeId,
    paymentId: refund.paymentId,
    orderId,
    orderNumber,
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason,
    reportTimestamp: refund.completedAt ?? refund.createdAt,
    completedAt: refund.completedAt,
    createdAt: refund.createdAt,
  };
}
