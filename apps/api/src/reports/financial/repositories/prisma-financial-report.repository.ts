import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sumCurrencyAmounts } from "../../services/report-utils";
import {
  decimalToMoneyString,
  toIso,
} from "../../services/report-prisma-format";
import { derivePaymentStatus } from "../../sales/mappers/sales-order-fact.mapper";
import type {
  FinancialOrderFact,
  FinancialReportRepository,
  InvoiceFact,
  ListFinancialOrderFactsQuery,
  ListInvoiceFactsQuery,
  ListPaymentFactsQuery,
  ListRefundFactsQuery,
  PaymentFact,
  RefundFact,
} from "./financial-report.repository";

/**
 * Database-backed financial reporting: filtered ledger queries with nested
 * relations instead of paging all orders and N+1 payment/refund lookups.
 */
export class PrismaFinancialReportRepository implements FinancialReportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listOrderFacts(
    query: ListFinancialOrderFactsQuery,
  ): Promise<readonly FinancialOrderFact[]> {
    const orders = await this.db.order.findMany({
      where: {
        storeId: query.storeId,
        ...(query.orderStatus ? { status: query.orderStatus } : {}),
        ...(query.currency ? { currency: query.currency } : {}),
      },
      select: {
        id: true,
        storeId: true,
        orderNumber: true,
        status: true,
        currency: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shippingAmount: true,
        total: true,
        confirmedAt: true,
        createdAt: true,
        payments: {
          select: {
            status: true,
            refunds: {
              where: { status: "completed" },
              select: { amount: true },
            },
          },
        },
        shipments: {
          select: { warehouseId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return orders.map((order) => {
      const refundAmounts = order.payments.flatMap((payment) =>
        payment.refunds.map((refund) => decimalToMoneyString(refund.amount)),
      );
      const createdAt = order.createdAt.toISOString();
      const confirmedAt = toIso(order.confirmedAt);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        orderStatus: order.status,
        paymentStatus: derivePaymentStatus(order.payments),
        warehouseId: order.shipments[0]?.warehouseId ?? undefined,
        currency: order.currency,
        subtotal: decimalToMoneyString(order.subtotal),
        discountAmount: decimalToMoneyString(order.discountAmount),
        taxAmount: decimalToMoneyString(order.taxAmount),
        shippingAmount: decimalToMoneyString(order.shippingAmount),
        total: decimalToMoneyString(order.total),
        refundTotal:
          refundAmounts.length > 0 ? sumCurrencyAmounts(refundAmounts) : "0.00",
        reportTimestamp: confirmedAt ?? createdAt,
        createdAt,
        confirmedAt,
      };
    });
  }

  async listInvoiceFacts(
    query: ListInvoiceFactsQuery,
  ): Promise<readonly InvoiceFact[]> {
    const invoices = await this.db.invoice.findMany({
      where: {
        storeId: query.storeId,
        ...(query.currency ? { currency: query.currency } : {}),
        ...(query.invoiceStatus ? { status: query.invoiceStatus } : {}),
      },
      select: {
        id: true,
        storeId: true,
        orderId: true,
        invoiceNumber: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shippingAmount: true,
        total: true,
        currency: true,
        issuedAt: true,
        paidAt: true,
        createdAt: true,
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return invoices.map((invoice) => {
      const createdAt = invoice.createdAt.toISOString();
      const issuedAt = toIso(invoice.issuedAt);
      const paidAt = toIso(invoice.paidAt);

      return {
        invoiceId: invoice.id,
        storeId: invoice.storeId,
        orderId: invoice.orderId,
        orderNumber: invoice.order.orderNumber,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subtotal: decimalToMoneyString(invoice.subtotal),
        discountAmount: decimalToMoneyString(invoice.discountAmount),
        taxAmount: decimalToMoneyString(invoice.taxAmount),
        shippingAmount: decimalToMoneyString(invoice.shippingAmount),
        total: decimalToMoneyString(invoice.total),
        currency: invoice.currency,
        reportTimestamp: issuedAt ?? paidAt ?? createdAt,
        issuedAt,
        paidAt,
        createdAt,
      };
    });
  }

  async listPaymentFacts(
    query: ListPaymentFactsQuery,
  ): Promise<readonly PaymentFact[]> {
    const payments = await this.db.payment.findMany({
      where: {
        storeId: query.storeId,
        ...(query.currency ? { currency: query.currency } : {}),
        ...(query.paymentStatus ? { status: query.paymentStatus } : {}),
      },
      select: {
        id: true,
        storeId: true,
        orderId: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        reference: true,
        createdAt: true,
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return payments.map((payment) => {
      const createdAt = payment.createdAt.toISOString();

      return {
        paymentId: payment.id,
        storeId: payment.storeId,
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        amount: decimalToMoneyString(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        reference: payment.reference,
        reportTimestamp: createdAt,
        createdAt,
      };
    });
  }

  async listRefundFacts(
    query: ListRefundFactsQuery,
  ): Promise<readonly RefundFact[]> {
    const refunds = await this.db.refund.findMany({
      where: {
        storeId: query.storeId,
        ...(query.currency ? { currency: query.currency } : {}),
      },
      select: {
        id: true,
        storeId: true,
        paymentId: true,
        amount: true,
        currency: true,
        status: true,
        reason: true,
        completedAt: true,
        createdAt: true,
        payment: {
          select: {
            orderId: true,
            order: { select: { orderNumber: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return refunds.map((refund) => {
      const createdAt = refund.createdAt.toISOString();
      const completedAt = toIso(refund.completedAt);

      return {
        refundId: refund.id,
        storeId: refund.storeId,
        paymentId: refund.paymentId,
        orderId: refund.payment.orderId,
        orderNumber: refund.payment.order.orderNumber,
        amount: decimalToMoneyString(refund.amount),
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        reportTimestamp: completedAt ?? createdAt,
        completedAt,
        createdAt,
      };
    });
  }
}
