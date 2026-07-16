import type {
  SalesOrderReport,
  SalesStatusBreakdown,
  SalesWarehouseBreakdown,
} from "@commerceflow/types";

import { sumCurrencyAmounts } from "../../services/report-utils";
import type { SalesOrderFact } from "../repositories/sales-report.repository";

export function mapSalesOrderFactToReport(fact: SalesOrderFact): SalesOrderReport {
  return {
    orderId: fact.orderId,
    orderNumber: fact.orderNumber,
    storeId: fact.storeId,
    orderStatus: fact.orderStatus,
    paymentStatus: fact.paymentStatus,
    warehouseId: fact.warehouseId,
    currency: fact.currency,
    grossSales: fact.subtotal,
    discounts: fact.discountAmount,
    taxes: fact.taxAmount,
    shipping: fact.shippingAmount,
    netSales: fact.total,
    unitsSold: fact.unitsSold,
    confirmedAt: fact.confirmedAt,
    createdAt: fact.createdAt,
  };
}

export function mapFactsToStatusBreakdown(
  status: string,
  facts: readonly SalesOrderFact[],
): SalesStatusBreakdown {
  return {
    status,
    orderCount: facts.length,
    grossSales: sumField(facts, "subtotal"),
    discounts: sumField(facts, "discountAmount"),
    taxes: sumField(facts, "taxAmount"),
    shipping: sumField(facts, "shippingAmount"),
    netSales: sumField(facts, "total"),
    unitsSold: facts.reduce((total, fact) => total + fact.unitsSold, 0),
  };
}

export function mapFactsToWarehouseBreakdown(
  warehouseId: string,
  facts: readonly SalesOrderFact[],
): SalesWarehouseBreakdown {
  return {
    warehouseId,
    orderCount: facts.length,
    grossSales: sumField(facts, "subtotal"),
    discounts: sumField(facts, "discountAmount"),
    taxes: sumField(facts, "taxAmount"),
    shipping: sumField(facts, "shippingAmount"),
    netSales: sumField(facts, "total"),
    unitsSold: facts.reduce((total, fact) => total + fact.unitsSold, 0),
  };
}

function sumField(
  facts: readonly SalesOrderFact[],
  field: keyof Pick<
    SalesOrderFact,
    "subtotal" | "discountAmount" | "taxAmount" | "shippingAmount" | "total"
  >,
): string {
  return sumCurrencyAmounts(facts.map((fact) => fact[field]));
}
