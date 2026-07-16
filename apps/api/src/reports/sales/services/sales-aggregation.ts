import type {
  OrderStatus,
  SalesFinancialMetrics,
  SalesPeriodBreakdown,
  SalesTimelineGranularity,
  SalesTimelinePoint,
} from "@commerceflow/types";

import {
  formatCurrencyAmount,
  groupItems,
  parseCurrencyAmount,
  sumCurrencyAmounts,
} from "../../services/report-utils";
import {
  mapFactsToStatusBreakdown,
  mapFactsToWarehouseBreakdown,
} from "../mappers/sales-report.mapper";
import type { SalesOrderFact } from "../repositories/sales-report.repository";

const REVENUE_ORDER_STATUSES = new Set<OrderStatus>(["confirmed", "fulfilled"]);

export function isRevenueOrder(status: OrderStatus): boolean {
  return REVENUE_ORDER_STATUSES.has(status);
}

export function filterRevenueFacts(
  facts: readonly SalesOrderFact[],
): readonly SalesOrderFact[] {
  return facts.filter((fact) => isRevenueOrder(fact.orderStatus));
}

export function divideCurrencyAmount(total: string, divisor: number): string {
  if (divisor === 0) {
    return "0.00";
  }

  const totalCents = parseCurrencyAmount(total);
  const quotient = totalCents / BigInt(divisor);
  const remainder = totalCents % BigInt(divisor);
  const rounded =
    remainder * 2n >= BigInt(divisor) ? quotient + 1n : quotient;

  return formatCurrencyAmount(rounded);
}

export function buildFinancialMetrics(
  facts: readonly SalesOrderFact[],
  currency: string,
): SalesFinancialMetrics {
  const revenueFacts = filterRevenueFacts(facts);
  const grossSales = sumCurrencyAmounts(revenueFacts.map((fact) => fact.subtotal));
  const discounts = sumCurrencyAmounts(
    revenueFacts.map((fact) => fact.discountAmount),
  );
  const taxes = sumCurrencyAmounts(revenueFacts.map((fact) => fact.taxAmount));
  const shipping = sumCurrencyAmounts(
    revenueFacts.map((fact) => fact.shippingAmount),
  );
  const netSales = sumCurrencyAmounts(revenueFacts.map((fact) => fact.total));
  const orderCount = revenueFacts.length;
  const unitsSold = revenueFacts.reduce(
    (total, fact) => total + fact.unitsSold,
    0,
  );

  return {
    grossSales,
    discounts,
    taxes,
    shipping,
    netSales,
    averageOrderValue: divideCurrencyAmount(netSales, orderCount),
    orderCount,
    unitsSold,
    currency,
  };
}

export function buildStatusBreakdowns(
  facts: readonly SalesOrderFact[],
  field: "orderStatus" | "paymentStatus" | "storeId",
): ReturnType<typeof mapFactsToStatusBreakdown>[] {
  const groups = groupItems(
    facts.map((fact) => ({
      ...fact,
      storeId: fact.storeId,
      orderStatus: fact.orderStatus,
      paymentStatus: fact.paymentStatus,
    })),
    field,
  );

  return [...groups.entries()]
    .map(([status, groupedFacts]) =>
      mapFactsToStatusBreakdown(status, groupedFacts as SalesOrderFact[]),
    )
    .sort((left, right) => left.status.localeCompare(right.status));
}

export function buildWarehouseBreakdowns(
  facts: readonly SalesOrderFact[],
): ReturnType<typeof mapFactsToWarehouseBreakdown>[] {
  const warehouseFacts = facts.filter((fact) => fact.warehouseId !== undefined);
  const groups = groupItems(
    warehouseFacts.map((fact) => ({
      ...fact,
      warehouseId: fact.warehouseId ?? "unknown",
    })),
    "warehouseId",
  );

  return [...groups.entries()]
    .map(([warehouseId, groupedFacts]) =>
      mapFactsToWarehouseBreakdown(
        warehouseId,
        groupedFacts as SalesOrderFact[],
      ),
    )
    .sort((left, right) => left.warehouseId.localeCompare(right.warehouseId));
}

interface ZonedDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: number;
}

function getZonedDateParts(
  timestamp: string,
  timezone: string,
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = formatter.formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: weekdayMap[values.weekday ?? "Sun"] ?? 0,
  };
}

function formatDateKey(parts: Pick<ZonedDateParts, "year" | "month" | "day">): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function subtractDays(
  parts: ZonedDateParts,
  days: number,
): Pick<ZonedDateParts, "year" | "month" | "day"> {
  const utcDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day - days, 12, 0, 0),
  );

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

export function resolvePeriodKey(
  timestamp: string,
  timezone: string,
  granularity: SalesTimelineGranularity,
): string {
  const parts = getZonedDateParts(timestamp, timezone);

  if (granularity === "month") {
    return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
  }

  if (granularity === "day") {
    return formatDateKey(parts);
  }

  const daysFromMonday = (parts.weekday + 6) % 7;
  return formatDateKey(subtractDays(parts, daysFromMonday));
}

function buildPeriodBreakdown(
  periodLabel: string,
  facts: readonly SalesOrderFact[],
  currency: string,
): SalesPeriodBreakdown {
  const metrics = buildFinancialMetrics(facts, currency);

  return {
    periodLabel,
    periodStart: periodLabel,
    periodEnd: periodLabel,
    orderCount: metrics.orderCount,
    grossSales: metrics.grossSales,
    discounts: metrics.discounts,
    taxes: metrics.taxes,
    shipping: metrics.shipping,
    netSales: metrics.netSales,
    unitsSold: metrics.unitsSold,
  };
}

export function buildPeriodBreakdowns(
  facts: readonly SalesOrderFact[],
  timezone: string,
  granularity: SalesTimelineGranularity,
  currency: string,
): readonly SalesPeriodBreakdown[] {
  const groups = new Map<string, SalesOrderFact[]>();

  for (const fact of facts) {
    const key = resolvePeriodKey(fact.reportTimestamp, timezone, granularity);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, fact]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([periodLabel, groupedFacts]) =>
      buildPeriodBreakdown(periodLabel, groupedFacts, currency),
    );
}

export function buildTimelinePoints(
  facts: readonly SalesOrderFact[],
  timezone: string,
  granularity: SalesTimelineGranularity,
  currency: string,
): readonly SalesTimelinePoint[] {
  const groups = new Map<string, SalesOrderFact[]>();

  for (const fact of facts) {
    const key = resolvePeriodKey(fact.reportTimestamp, timezone, granularity);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, fact]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([periodLabel, groupedFacts]) => {
      const metrics = buildFinancialMetrics(groupedFacts, currency);

      return {
        periodStart: periodLabel,
        periodEnd: periodLabel,
        periodLabel,
        granularity,
        metrics,
      };
    });
}

export function sumField(
  facts: readonly SalesOrderFact[],
  field: keyof Pick<
    SalesOrderFact,
    "subtotal" | "discountAmount" | "taxAmount" | "shippingAmount" | "total"
  >,
): string {
  return sumCurrencyAmounts(facts.map((fact) => fact[field]));
}
