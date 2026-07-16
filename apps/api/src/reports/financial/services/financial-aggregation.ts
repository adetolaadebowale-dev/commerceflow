import type {
  DiscountSummary,
  FinancialMetrics,
  InvoiceSummary,
  PaymentSummary,
  RefundSummary,
  RevenueTimelineGranularity,
  RevenueTimelinePoint,
  ShippingRevenueSummary,
  TaxSummary,
} from "@commerceflow/types";

import {
  formatCurrencyAmount,
  parseCurrencyAmount,
  sumCurrencyAmounts,
} from "../../services/report-utils";
import {
  divideCurrencyAmount,
  isRevenueOrder,
  resolvePeriodKey,
} from "../../sales/services/sales-aggregation";
import type {
  FinancialOrderFact,
  InvoiceFact,
  PaymentFact,
  RefundFact,
} from "../repositories/financial-report.repository";

export function netOrderRevenue(fact: FinancialOrderFact): string {
  const total = parseCurrencyAmount(fact.total);
  const refund = parseCurrencyAmount(fact.refundTotal);
  return formatCurrencyAmount(total - refund);
}

function filterRevenueOrderFacts(
  facts: readonly FinancialOrderFact[],
): readonly FinancialOrderFact[] {
  return facts.filter((fact) => isRevenueOrder(fact.orderStatus));
}

function formatRate(numerator: string, denominator: string): string {
  const denominatorCents = parseCurrencyAmount(denominator);
  if (denominatorCents === 0n) {
    return "0.00";
  }

  const numeratorCents = parseCurrencyAmount(numerator);
  const rate = (Number(numeratorCents) / Number(denominatorCents)) * 100;
  return rate.toFixed(2);
}

export function buildFinancialMetrics(
  orderFacts: readonly FinancialOrderFact[],
  invoiceFacts: readonly InvoiceFact[],
  paymentFacts: readonly PaymentFact[],
  refundFacts: readonly RefundFact[],
  currency: string,
): FinancialMetrics {
  const revenueFacts = filterRevenueOrderFacts(orderFacts);
  const grossRevenue = sumCurrencyAmounts(revenueFacts.map((fact) => fact.subtotal));
  const discounts = sumCurrencyAmounts(
    revenueFacts.map((fact) => fact.discountAmount),
  );
  const taxes = sumCurrencyAmounts(revenueFacts.map((fact) => fact.taxAmount));
  const shippingRevenue = sumCurrencyAmounts(
    revenueFacts.map((fact) => fact.shippingAmount),
  );
  const refundTotals = sumCurrencyAmounts(
    refundFacts
      .filter((fact) => fact.status === "completed")
      .map((fact) => fact.amount),
  );
  const netRevenue = sumCurrencyAmounts(
    revenueFacts.map((fact) => netOrderRevenue(fact)),
  );

  const invoiceSummary = buildInvoiceSummary(invoiceFacts, currency);
  const paymentSummary = buildPaymentSummary(paymentFacts, currency);

  return {
    grossRevenue,
    netRevenue,
    discounts,
    taxes,
    shippingRevenue,
    refundTotals,
    invoiceTotals: invoiceSummary.totalAmount,
    paymentTotals: paymentSummary.totalAmount,
    outstandingInvoices: invoiceSummary.outstandingAmount,
    collectionRate: formatRate(
      invoiceSummary.paidAmount,
      sumCurrencyAmounts([
        invoiceSummary.paidAmount,
        invoiceSummary.outstandingAmount,
      ]),
    ),
    averagePaymentAmount: divideCurrencyAmount(
      paymentSummary.paidAmount,
      paymentSummary.paidCount,
    ),
    currency,
  };
}

export function buildPaymentSummary(
  facts: readonly PaymentFact[],
  currency: string,
): PaymentSummary {
  const activeFacts = facts.filter((fact) => fact.status !== "cancelled");
  const sumByStatus = (status: PaymentFact["status"]) =>
    sumCurrencyAmounts(
      activeFacts.filter((fact) => fact.status === status).map((fact) => fact.amount),
    );
  const countByStatus = (status: PaymentFact["status"]) =>
    activeFacts.filter((fact) => fact.status === status).length;

  return {
    totalAmount: sumCurrencyAmounts(activeFacts.map((fact) => fact.amount)),
    paymentCount: activeFacts.length,
    paidAmount: sumByStatus("paid"),
    paidCount: countByStatus("paid"),
    authorizedAmount: sumByStatus("authorized"),
    authorizedCount: countByStatus("authorized"),
    pendingAmount: sumByStatus("pending"),
    pendingCount: countByStatus("pending"),
    failedAmount: sumByStatus("failed"),
    failedCount: countByStatus("failed"),
    currency,
  };
}

export function buildInvoiceSummary(
  facts: readonly InvoiceFact[],
  currency: string,
): InvoiceSummary {
  const activeFacts = facts.filter((fact) => fact.status !== "void");
  const sumByStatus = (status: InvoiceFact["status"]) =>
    sumCurrencyAmounts(
      activeFacts.filter((fact) => fact.status === status).map((fact) => fact.total),
    );
  const countByStatus = (status: InvoiceFact["status"]) =>
    activeFacts.filter((fact) => fact.status === status).length;

  return {
    totalAmount: sumCurrencyAmounts(activeFacts.map((fact) => fact.total)),
    invoiceCount: activeFacts.length,
    issuedAmount: sumByStatus("issued"),
    issuedCount: countByStatus("issued"),
    paidAmount: sumByStatus("paid"),
    paidCount: countByStatus("paid"),
    outstandingAmount: sumByStatus("issued"),
    outstandingCount: countByStatus("issued"),
    voidAmount: sumCurrencyAmounts(
      facts.filter((fact) => fact.status === "void").map((fact) => fact.total),
    ),
    voidCount: facts.filter((fact) => fact.status === "void").length,
    currency,
  };
}

export function buildRefundSummary(
  facts: readonly RefundFact[],
  currency: string,
): RefundSummary {
  const sumByStatus = (status: RefundFact["status"]) =>
    sumCurrencyAmounts(
      facts.filter((fact) => fact.status === status).map((fact) => fact.amount),
    );
  const countByStatus = (status: RefundFact["status"]) =>
    facts.filter((fact) => fact.status === status).length;

  return {
    totalAmount: sumCurrencyAmounts(facts.map((fact) => fact.amount)),
    refundCount: facts.length,
    completedAmount: sumByStatus("completed"),
    completedCount: countByStatus("completed"),
    pendingAmount: sumByStatus("pending"),
    pendingCount: countByStatus("pending"),
    currency,
  };
}

export function buildTaxSummary(
  orderFacts: readonly FinancialOrderFact[],
  currency: string,
): TaxSummary {
  const revenueFacts = filterRevenueOrderFacts(orderFacts);

  return {
    totalTax: sumCurrencyAmounts(revenueFacts.map((fact) => fact.taxAmount)),
    orderCount: revenueFacts.length,
    currency,
  };
}

export function buildDiscountSummary(
  orderFacts: readonly FinancialOrderFact[],
  currency: string,
): DiscountSummary {
  const revenueFacts = filterRevenueOrderFacts(orderFacts);

  return {
    totalDiscount: sumCurrencyAmounts(
      revenueFacts.map((fact) => fact.discountAmount),
    ),
    orderCount: revenueFacts.length,
    currency,
  };
}

export function buildShippingRevenueSummary(
  orderFacts: readonly FinancialOrderFact[],
  currency: string,
): ShippingRevenueSummary {
  const revenueFacts = filterRevenueOrderFacts(orderFacts);

  return {
    totalShipping: sumCurrencyAmounts(
      revenueFacts.map((fact) => fact.shippingAmount),
    ),
    orderCount: revenueFacts.length,
    currency,
  };
}

export function buildRevenueTimelinePoints(
  orderFacts: readonly FinancialOrderFact[],
  refundFacts: readonly RefundFact[],
  timezone: string,
  granularity: RevenueTimelineGranularity,
  currency: string,
): readonly RevenueTimelinePoint[] {
  const revenueFacts = filterRevenueOrderFacts(orderFacts);
  const groups = new Map<string, FinancialOrderFact[]>();

  for (const fact of revenueFacts) {
    const key = resolvePeriodKey(fact.reportTimestamp, timezone, granularity);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, fact]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([periodLabel, groupedFacts]) => {
      const grossRevenue = sumCurrencyAmounts(
        groupedFacts.map((fact) => fact.subtotal),
      );
      const discounts = sumCurrencyAmounts(
        groupedFacts.map((fact) => fact.discountAmount),
      );
      const taxes = sumCurrencyAmounts(groupedFacts.map((fact) => fact.taxAmount));
      const shippingRevenue = sumCurrencyAmounts(
        groupedFacts.map((fact) => fact.shippingAmount),
      );
      const netRevenue = sumCurrencyAmounts(
        groupedFacts.map((fact) => netOrderRevenue(fact)),
      );
      const orderIds = new Set(groupedFacts.map((fact) => fact.orderId));
      const refundTotals = sumCurrencyAmounts(
        refundFacts
          .filter(
            (fact) =>
              fact.status === "completed" && orderIds.has(fact.orderId),
          )
          .map((fact) => fact.amount),
      );

      return {
        periodStart: periodLabel,
        periodEnd: periodLabel,
        periodLabel,
        granularity,
        grossRevenue,
        netRevenue,
        discounts,
        taxes,
        shippingRevenue,
        refundTotals,
        currency,
      };
    });
}

export { filterRevenueOrderFacts };
