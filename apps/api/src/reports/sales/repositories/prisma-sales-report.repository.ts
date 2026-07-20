import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  decimalToMoneyString,
  toIso,
} from "../../services/report-prisma-format";
import { derivePaymentStatus } from "../mappers/sales-order-fact.mapper";
import type {
  ListSalesOrderFactsQuery,
  SalesOrderFact,
  SalesReportRepository,
} from "./sales-report.repository";

/**
 * Database-backed sales reporting: one order query with nested payments,
 * line quantities, and first shipment warehouse — no N+1 domain reads.
 */
export class PrismaSalesReportRepository implements SalesReportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listOrderFacts(
    query: ListSalesOrderFactsQuery,
  ): Promise<readonly SalesOrderFact[]> {
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
        items: { select: { quantity: true } },
        payments: { select: { status: true } },
        shipments: {
          select: { warehouseId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return orders.map((order) => {
      const createdAt = order.createdAt.toISOString();
      const confirmedAt = toIso(order.confirmedAt);

      return {
        orderId: order.id,
        storeId: order.storeId,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        paymentStatus: derivePaymentStatus(order.payments),
        warehouseId: order.shipments[0]?.warehouseId ?? undefined,
        currency: order.currency,
        subtotal: decimalToMoneyString(order.subtotal),
        discountAmount: decimalToMoneyString(order.discountAmount),
        taxAmount: decimalToMoneyString(order.taxAmount),
        shippingAmount: decimalToMoneyString(order.shippingAmount),
        total: decimalToMoneyString(order.total),
        unitsSold: order.items.reduce((sum, item) => sum + item.quantity, 0),
        reportTimestamp: confirmedAt ?? createdAt,
        createdAt,
        confirmedAt,
      };
    });
  }
}
