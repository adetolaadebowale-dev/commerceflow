import type {
  CustomerGeographicDistributionRow,
  CustomerGrowthGranularity,
  CustomerGrowthPoint,
  CustomerLifetimeValue,
  CustomerMetrics,
  CustomerNewVsReturningBreakdown,
  CustomerPurchaseFrequencyBand,
  CustomerStatus,
  ReportDateRange,
  TopCustomerReport,
} from "@commerceflow/types";

import {
  formatCurrencyAmount,
  parseCurrencyAmount,
  sumCurrencyAmounts,
} from "../../services/report-utils";
import {
  divideCurrencyAmount,
  filterRevenueFacts,
  isRevenueOrder,
  resolvePeriodKey,
} from "../../sales/services/sales-aggregation";
import type {
  CustomerOrderFact,
  CustomerProfileFact,
} from "../repositories/customer-report.repository";

export function netOrderTotal(fact: CustomerOrderFact): string {
  const total = parseCurrencyAmount(fact.total);
  const refund = parseCurrencyAmount(fact.refundTotal);
  return formatCurrencyAmount(total - refund);
}

function filterRevenueCustomerFacts(
  facts: readonly CustomerOrderFact[],
): readonly CustomerOrderFact[] {
  return facts.filter((fact) => isRevenueOrder(fact.orderStatus));
}

function groupOrdersByCustomer(
  facts: readonly CustomerOrderFact[],
): Map<string, CustomerOrderFact[]> {
  const groups = new Map<string, CustomerOrderFact[]>();

  for (const fact of facts) {
    if (!fact.customerProfileId) {
      continue;
    }

    const existing = groups.get(fact.customerProfileId) ?? [];
    existing.push(fact);
    groups.set(fact.customerProfileId, existing);
  }

  return groups;
}

function sortOrdersByTimestamp(
  facts: readonly CustomerOrderFact[],
): CustomerOrderFact[] {
  return [...facts].sort((left, right) =>
    left.reportTimestamp.localeCompare(right.reportTimestamp),
  );
}

function earliestRevenueTimestamp(
  facts: readonly CustomerOrderFact[],
): string | undefined {
  const revenueFacts = filterRevenueCustomerFacts(facts);
  if (revenueFacts.length === 0) {
    return undefined;
  }

  return sortOrdersByTimestamp(revenueFacts)[0]?.reportTimestamp;
}

function isNewCustomerInRange(
  customerOrders: readonly CustomerOrderFact[],
  allCustomerOrders: readonly CustomerOrderFact[],
  dateRange?: ReportDateRange,
): boolean {
  if (!dateRange) {
    return false;
  }

  const firstRevenueAt =
    earliestRevenueTimestamp(allCustomerOrders) ??
    earliestRevenueTimestamp(customerOrders);

  if (!firstRevenueAt) {
    return false;
  }

  return (
    firstRevenueAt.localeCompare(dateRange.from) >= 0 &&
    firstRevenueAt.localeCompare(dateRange.to) <= 0
  );
}

function computeAveragePurchaseIntervalDays(
  facts: readonly CustomerOrderFact[],
): number | undefined {
  const revenueFacts = sortOrdersByTimestamp(filterRevenueCustomerFacts(facts));

  if (revenueFacts.length < 2) {
    return undefined;
  }

  let totalDays = 0;

  for (let index = 1; index < revenueFacts.length; index += 1) {
    const previous = new Date(revenueFacts[index - 1]!.reportTimestamp).getTime();
    const current = new Date(revenueFacts[index]!.reportTimestamp).getTime();
    totalDays += (current - previous) / (1000 * 60 * 60 * 24);
  }

  return Math.round((totalDays / (revenueFacts.length - 1)) * 100) / 100;
}

function buildCustomerLifetimeValue(
  customerId: string,
  facts: readonly CustomerOrderFact[],
  currency: string,
): CustomerLifetimeValue {
  const revenueFacts = filterRevenueCustomerFacts(facts);
  const grossRevenue = sumCurrencyAmounts(revenueFacts.map((fact) => fact.total));
  const refundTotal = sumCurrencyAmounts(revenueFacts.map((fact) => fact.refundTotal));
  const netLifetimeValue = sumCurrencyAmounts(
    revenueFacts.map((fact) => netOrderTotal(fact)),
  );

  return {
    customerId,
    grossRevenue,
    refundTotal,
    netLifetimeValue,
    orderCount: revenueFacts.length,
    currency,
  };
}

export function buildCustomerMetrics(
  profileFacts: readonly CustomerProfileFact[],
  periodOrderFacts: readonly CustomerOrderFact[],
  allOrderFacts: readonly CustomerOrderFact[],
  currency: string,
  dateRange?: ReportDateRange,
): CustomerMetrics {
  const revenueFacts = filterRevenueCustomerFacts(periodOrderFacts);
  const ordersByCustomer = groupOrdersByCustomer(revenueFacts);
  const allOrdersByCustomer = groupOrdersByCustomer(allOrderFacts);

  const activeCustomerIds = new Set(
    revenueFacts
      .map((fact) => fact.customerProfileId)
      .filter((customerId): customerId is string => customerId !== undefined),
  );

  let newCustomers = 0;
  let returningCustomers = 0;

  for (const customerId of activeCustomerIds) {
    const customerOrders = allOrdersByCustomer.get(customerId) ?? [];

    if (isNewCustomerInRange(customerOrders, customerOrders, dateRange)) {
      newCustomers += 1;
    } else {
      returningCustomers += 1;
    }
  }

  const lifetimeValue = sumCurrencyAmounts(
    revenueFacts.map((fact) => netOrderTotal(fact)),
  );
  const orderCount = revenueFacts.length;
  const uniqueCustomers = ordersByCustomer.size;
  const intervals: number[] = [];

  for (const customerOrders of ordersByCustomer.values()) {
    const interval = computeAveragePurchaseIntervalDays(customerOrders);
    if (interval !== undefined) {
      intervals.push(interval);
    }
  }

  const averagePurchaseIntervalDays =
    intervals.length > 0
      ? Math.round(
          (intervals.reduce((total, value) => total + value, 0) /
            intervals.length) *
            100,
        ) / 100
      : 0;

  return {
    totalCustomers: profileFacts.length,
    activeCustomers: activeCustomerIds.size,
    newCustomers,
    returningCustomers,
    lifetimeValue,
    averageOrderValue: divideCurrencyAmount(lifetimeValue, orderCount),
    ordersPerCustomer:
      uniqueCustomers > 0
        ? Math.round((orderCount / uniqueCustomers) * 100) / 100
        : 0,
    revenuePerCustomer: divideCurrencyAmount(lifetimeValue, uniqueCustomers),
    averagePurchaseIntervalDays,
    currency,
  };
}

export function buildNewVsReturningBreakdown(
  allOrderFacts: readonly CustomerOrderFact[],
  periodOrderFacts: readonly CustomerOrderFact[],
  dateRange?: ReportDateRange,
): CustomerNewVsReturningBreakdown {
  const periodFacts = filterRevenueCustomerFacts(periodOrderFacts);
  const allOrdersByCustomer = groupOrdersByCustomer(allOrderFacts);
  const activeCustomerIds = new Set(
    periodFacts
      .map((fact) => fact.customerProfileId)
      .filter((customerId): customerId is string => customerId !== undefined),
  );

  let newCustomers = 0;
  let returningCustomers = 0;
  const newCustomerRevenueValues: string[] = [];
  const returningCustomerRevenueValues: string[] = [];

  for (const customerId of activeCustomerIds) {
    const customerOrders = allOrdersByCustomer.get(customerId) ?? [];
    const customerPeriodFacts = periodFacts.filter(
      (fact) => fact.customerProfileId === customerId,
    );
    const periodRevenue = sumCurrencyAmounts(
      customerPeriodFacts.map((fact) => netOrderTotal(fact)),
    );

    if (isNewCustomerInRange(customerOrders, customerOrders, dateRange)) {
      newCustomers += 1;
      newCustomerRevenueValues.push(periodRevenue);
    } else {
      returningCustomers += 1;
      returningCustomerRevenueValues.push(periodRevenue);
    }
  }

  return {
    newCustomers,
    returningCustomers,
    newCustomerRevenue: sumCurrencyAmounts(newCustomerRevenueValues),
    returningCustomerRevenue: sumCurrencyAmounts(returningCustomerRevenueValues),
  };
}

const PURCHASE_FREQUENCY_BANDS: readonly CustomerPurchaseFrequencyBand[] = [
  { label: "1 order", minOrders: 1, maxOrders: 1, customerCount: 0 },
  { label: "2 orders", minOrders: 2, maxOrders: 2, customerCount: 0 },
  { label: "3-5 orders", minOrders: 3, maxOrders: 5, customerCount: 0 },
  { label: "6+ orders", minOrders: 6, customerCount: 0 },
];

export function buildPurchaseFrequencyBands(
  orderFacts: readonly CustomerOrderFact[],
): readonly CustomerPurchaseFrequencyBand[] {
  const revenueFacts = filterRevenueCustomerFacts(orderFacts);
  const ordersByCustomer = groupOrdersByCustomer(revenueFacts);

  return PURCHASE_FREQUENCY_BANDS.map((band) => {
    let customerCount = 0;

    for (const customerOrders of ordersByCustomer.values()) {
      const orderCount = customerOrders.length;
      const withinMin = orderCount >= band.minOrders;
      const withinMax =
        band.maxOrders === undefined ? true : orderCount <= band.maxOrders;

      if (withinMin && withinMax) {
        customerCount += 1;
      }
    }

    return {
      label: band.label,
      minOrders: band.minOrders,
      maxOrders: band.maxOrders,
      customerCount,
    };
  });
}

export function buildGeographicDistribution(
  profileFacts: readonly CustomerProfileFact[],
  orderFacts: readonly CustomerOrderFact[],
): readonly CustomerGeographicDistributionRow[] {
  const revenueFacts = filterRevenueCustomerFacts(orderFacts);
  const profileByCustomerId = new Map(
    profileFacts.map((profile) => [profile.customerId, profile]),
  );
  const groups = new Map<
    string,
    {
      countryCode: string;
      city?: string;
      customerIds: Set<string>;
      orderCount: number;
      revenueValues: string[];
    }
  >();

  for (const fact of revenueFacts) {
    if (!fact.customerProfileId) {
      continue;
    }

    const profile = profileByCustomerId.get(fact.customerProfileId);
    const countryCode = profile?.defaultCountryCode ?? "UNKNOWN";
    const city = profile?.defaultCity;
    const key = `${countryCode}:${city ?? "*"}`;
    const existing = groups.get(key) ?? {
      countryCode,
      city,
      customerIds: new Set<string>(),
      orderCount: 0,
      revenueValues: [],
    };

    existing.customerIds.add(fact.customerProfileId);
    existing.orderCount += 1;
    existing.revenueValues.push(netOrderTotal(fact));
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      countryCode: group.countryCode,
      city: group.city,
      customerCount: group.customerIds.size,
      orderCount: group.orderCount,
      revenue: sumCurrencyAmounts(group.revenueValues),
    }))
    .sort((left, right) => right.revenue.localeCompare(left.revenue));
}

export function buildGrowthPoints(
  profileFacts: readonly CustomerProfileFact[],
  orderFacts: readonly CustomerOrderFact[],
  timezone: string,
  granularity: CustomerGrowthGranularity,
  dateRange?: ReportDateRange,
): readonly CustomerGrowthPoint[] {
  const revenueFacts = filterRevenueCustomerFacts(orderFacts);
  const scopedFacts = dateRange
    ? revenueFacts.filter(
        (fact) =>
          fact.reportTimestamp.localeCompare(dateRange.from) >= 0 &&
          fact.reportTimestamp.localeCompare(dateRange.to) <= 0,
      )
    : revenueFacts;

  if (scopedFacts.length === 0 && profileFacts.length === 0) {
    return [];
  }

  const periodKeys = new Set<string>();

  for (const fact of scopedFacts) {
    periodKeys.add(resolvePeriodKey(fact.reportTimestamp, timezone, granularity));
  }

  for (const profile of profileFacts) {
    periodKeys.add(
      resolvePeriodKey(profile.customerSince, timezone, granularity),
    );
  }

  const allOrdersByCustomer = groupOrdersByCustomer(orderFacts);

  return [...periodKeys]
    .sort((left, right) => left.localeCompare(right))
    .map((periodLabel) => {
      const periodFacts = scopedFacts.filter(
        (fact) =>
          resolvePeriodKey(fact.reportTimestamp, timezone, granularity) ===
          periodLabel,
      );
      const activeCustomerIds = new Set(
        periodFacts
          .map((fact) => fact.customerProfileId)
          .filter((customerId): customerId is string => customerId !== undefined),
      );

      let newCustomers = 0;
      let returningCustomers = 0;

      for (const customerId of activeCustomerIds) {
        const customerOrders = allOrdersByCustomer.get(customerId) ?? [];
        const firstRevenueAt = earliestRevenueTimestamp(customerOrders);

        if (
          firstRevenueAt &&
          resolvePeriodKey(firstRevenueAt, timezone, granularity) === periodLabel
        ) {
          newCustomers += 1;
        } else {
          returningCustomers += 1;
        }
      }

      const totalCustomers = profileFacts.filter(
        (profile) =>
          resolvePeriodKey(profile.customerSince, timezone, granularity) <=
          periodLabel,
      ).length;

      const timestamps = [
        ...periodFacts.map((fact) => fact.reportTimestamp),
        ...profileFacts.map((profile) => profile.customerSince),
      ].sort((left, right) => left.localeCompare(right));

      return {
        periodStart: timestamps[0] ?? periodLabel,
        periodEnd: timestamps[timestamps.length - 1] ?? periodLabel,
        periodLabel,
        granularity,
        totalCustomers,
        newCustomers,
        activeCustomers: activeCustomerIds.size,
        returningCustomers,
      };
    });
}

export function buildTopCustomerReports(
  profileFacts: readonly CustomerProfileFact[],
  orderFacts: readonly CustomerOrderFact[],
  currency: string,
): TopCustomerReport[] {
  const profileByCustomerId = new Map(
    profileFacts.map((profile) => [profile.customerId, profile]),
  );
  const ordersByCustomer = groupOrdersByCustomer(
    filterRevenueCustomerFacts(orderFacts),
  );

  return [...ordersByCustomer.entries()].map(([customerId, customerOrders]) => {
    const profile = profileByCustomerId.get(customerId);
    const lifetimeValue = buildCustomerLifetimeValue(
      customerId,
      customerOrders,
      currency,
    );
    const sortedOrders = sortOrdersByTimestamp(customerOrders);

    return {
      customerId,
      email: profile?.email ?? "",
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      customerSince: profile?.customerSince ?? sortedOrders[0]?.createdAt ?? "",
      lifetimeValue,
      averageOrderValue: divideCurrencyAmount(
        lifetimeValue.netLifetimeValue,
        lifetimeValue.orderCount,
      ),
      averagePurchaseIntervalDays: computeAveragePurchaseIntervalDays(customerOrders),
      lastOrderAt: sortedOrders[sortedOrders.length - 1]?.reportTimestamp,
    };
  });
}

export function filterProfilesByStatus(
  profiles: readonly CustomerProfileFact[],
  customerStatus?: CustomerStatus,
): readonly CustomerProfileFact[] {
  if (!customerStatus) {
    return profiles;
  }

  return profiles.filter((profile) => profile.status === customerStatus);
}

export { filterRevenueFacts as filterRevenueCustomerOrderFacts };
