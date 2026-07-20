import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sumCurrencyAmounts } from "../../services/report-utils";
import {
  decimalToMoneyString,
  toIso,
} from "../../services/report-prisma-format";
import { derivePaymentStatus } from "../../sales/mappers/sales-order-fact.mapper";
import type {
  CustomerOrderFact,
  CustomerProfileFact,
  CustomerReportRepository,
  ListCustomerOrderFactsQuery,
  ListCustomerProfileFactsQuery,
} from "./customer-report.repository";

/**
 * Database-backed customer reporting: nested address/payment/refund selects
 * replace per-customer and per-order N+1 domain repository calls.
 */
export class PrismaCustomerReportRepository implements CustomerReportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listCustomerProfileFacts(
    query: ListCustomerProfileFactsQuery,
  ): Promise<readonly CustomerProfileFact[]> {
    const customers = await this.db.customer.findMany({
      where: {
        storeId: query.storeId,
        deletedAt: null,
        ...(query.customerStatus ? { status: query.customerStatus } : {}),
        ...(query.customerIds && query.customerIds.length > 0
          ? { id: { in: [...query.customerIds] } }
          : {}),
      },
      select: {
        id: true,
        storeId: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        addresses: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          take: 1,
          select: { countryCode: true, city: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return customers.map((customer) => {
      const address = customer.addresses[0];

      return {
        customerId: customer.id,
        storeId: customer.storeId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
        customerSince: customer.createdAt.toISOString(),
        defaultCountryCode: address?.countryCode,
        defaultCity: address?.city,
      };
    });
  }

  async listCustomerOrderFacts(
    query: ListCustomerOrderFactsQuery,
  ): Promise<readonly CustomerOrderFact[]> {
    const orders = await this.db.order.findMany({
      where: {
        storeId: query.storeId,
        ...(query.orderStatus ? { status: query.orderStatus } : {}),
        ...(query.currency ? { currency: query.currency } : {}),
        ...(query.customerIds && query.customerIds.length > 0
          ? { customerProfileId: { in: [...query.customerIds] } }
          : {}),
      },
      select: {
        id: true,
        storeId: true,
        orderNumber: true,
        customerProfileId: true,
        status: true,
        currency: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shippingAmount: true,
        total: true,
        confirmedAt: true,
        createdAt: true,
        items: { select: { quantity: true } },
        payments: {
          select: {
            status: true,
            refunds: {
              where: { status: "completed" },
              select: { amount: true },
            },
          },
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
        customerProfileId: order.customerProfileId ?? undefined,
        storeId: order.storeId,
        orderStatus: order.status,
        paymentStatus: derivePaymentStatus(order.payments),
        currency: order.currency,
        subtotal: decimalToMoneyString(order.subtotal),
        discountAmount: decimalToMoneyString(order.discountAmount),
        taxAmount: decimalToMoneyString(order.taxAmount),
        shippingAmount: decimalToMoneyString(order.shippingAmount),
        total: decimalToMoneyString(order.total),
        refundTotal:
          refundAmounts.length > 0 ? sumCurrencyAmounts(refundAmounts) : "0.00",
        unitsPurchased: order.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
        reportTimestamp: confirmedAt ?? createdAt,
        createdAt,
        confirmedAt,
      };
    });
  }
}
