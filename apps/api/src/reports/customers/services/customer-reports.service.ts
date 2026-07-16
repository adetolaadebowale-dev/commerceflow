import type {
  CustomerGrowthReport,
  CustomerOrdersReport,
  CustomerSummary,
  TopCustomersReport,
} from "@commerceflow/types";
import type {
  CustomerGrowthQuery,
  CustomerOrdersQuery,
  CustomerSummaryQuery,
  TopCustomersQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getReportFoundationRepository,
  type ReportFoundationRepository,
} from "../../repositories";
import {
  assertStoreScope,
  buildReportFilter,
  isWithinDateRange,
  paginateItems,
  parseCurrencyAmount,
  sortItems,
} from "../../services/report-utils";
import { mapCustomerOrderFactToReport } from "../mappers/customer-report.mapper";
import {
  getCustomerReportRepository,
  type CustomerReportRepository,
} from "../repositories";
import type { CustomerOrderFact } from "../repositories/customer-report.repository";
import {
  buildCustomerMetrics,
  buildGeographicDistribution,
  buildGrowthPoints,
  buildNewVsReturningBreakdown,
  buildPurchaseFrequencyBands,
  buildTopCustomerReports,
} from "./customer-aggregation";

export interface CustomerReportsServiceDependencies {
  readonly customerReportRepository?: CustomerReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CustomerReportsService {
  private readonly customerReportRepository: CustomerReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CustomerReportsServiceDependencies = {}) {
    this.customerReportRepository =
      dependencies.customerReportRepository ?? getCustomerReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getSummary(query: CustomerSummaryQuery): Promise<CustomerSummary> {
    const {
      profileFacts,
      periodOrderFacts,
      allOrderFacts,
      filter,
      timezone,
      currency,
    } = await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();

    const summary: CustomerSummary = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      metrics: buildCustomerMetrics(
        profileFacts,
        periodOrderFacts,
        allOrderFacts,
        currency,
        filter.dateRange,
      ),
      newVsReturning: buildNewVsReturningBreakdown(
        allOrderFacts,
        periodOrderFacts,
        filter.dateRange,
      ),
      purchaseFrequency: buildPurchaseFrequencyBands(periodOrderFacts),
      geographicDistribution: buildGeographicDistribution(
        profileFacts,
        periodOrderFacts,
      ),
    };

    this.domainEventPublisher.publishCustomerReportGenerated(
      query.storeId,
      "summary",
      summary.metrics.totalCustomers,
      summary,
    );

    return summary;
  }

  async getGrowth(query: CustomerGrowthQuery): Promise<CustomerGrowthReport> {
    const { profileFacts, allOrderFacts, filter, timezone } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const points = buildGrowthPoints(
      profileFacts,
      allOrderFacts,
      timezone,
      query.granularity,
      filter.dateRange,
    );

    const report: CustomerGrowthReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      granularity: query.granularity,
      filter,
      points,
    };

    this.domainEventPublisher.publishCustomerReportGenerated(
      query.storeId,
      "growth",
      points.length,
      report,
    );

    return report;
  }

  async getTopCustomers(query: TopCustomersQuery): Promise<TopCustomersReport> {
    const { profileFacts, periodOrderFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const topCustomers = buildTopCustomerReports(
      profileFacts,
      periodOrderFacts,
      currency,
    );
    const sorted = sortItems(
      topCustomers.map((customer) => ({
        ...customer,
        lifetimeValueAmount: customer.lifetimeValue.netLifetimeValue,
        lifetimeValueCents: Number(
          parseCurrencyAmount(customer.lifetimeValue.netLifetimeValue),
        ),
        orderCount: customer.lifetimeValue.orderCount,
        customerSinceSort: customer.customerSince,
        generatedAt: customer.lastOrderAt ?? customer.customerSince,
      })),
      query.sortBy === "lifetimeValue"
        ? "lifetimeValueCents"
        : query.sortBy === "orderCount"
          ? "orderCount"
          : query.sortBy === "customerSince"
            ? "customerSinceSort"
            : "generatedAt",
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: TopCustomersReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      items: paginated.items.map(
        ({
          lifetimeValueAmount: _lifetimeValueAmount,
          lifetimeValueCents: _lifetimeValueCents,
          orderCount: _orderCount,
          customerSinceSort: _customerSinceSort,
          generatedAt: _generatedAt,
          ...customer
        }) => customer,
      ),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishCustomerReportGenerated(
      query.storeId,
      "top",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async listCustomerOrders(
    query: CustomerOrdersQuery,
  ): Promise<CustomerOrdersReport> {
    const { profileFacts, periodOrderFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const profileByCustomerId = new Map(
      profileFacts.map((profile) => [profile.customerId, profile]),
    );
    const sorted = sortItems(
      periodOrderFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);
    const items = paginated.items.map((fact) => {
      const customer = fact.customerProfileId
        ? profileByCustomerId.get(fact.customerProfileId)
        : undefined;

      return mapCustomerOrderFactToReport(
        fact as CustomerOrderFact,
        customer?.email,
      );
    });

    const report: CustomerOrdersReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      items,
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishCustomerReportGenerated(
      query.storeId,
      "orders",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadFilteredFacts(
    query:
      | CustomerSummaryQuery
      | CustomerGrowthQuery
      | TopCustomersQuery
      | CustomerOrdersQuery,
  ) {
    const context = await this.reportFoundationRepository.getStoreReportingContext(
      query.storeId,
    );
    const filter = buildReportFilter(query, {
      defaultTimezone: context.defaultTimezone,
      defaultCurrency: context.defaultCurrency,
      activeWarehouseIds: context.activeWarehouseIds,
    });
    const timezone = filter.dateRange?.timezone ?? context.defaultTimezone;
    const currency = filter.currency ?? context.defaultCurrency;

    const profileFacts = await this.customerReportRepository.listCustomerProfileFacts(
      {
        storeId: query.storeId,
        customerIds: query.customerIds,
        customerStatus: query.customerStatus,
      },
    );
    const allOrderFacts = await this.customerReportRepository.listCustomerOrderFacts(
      {
        storeId: query.storeId,
        orderStatus: query.orderStatus,
        currency: query.currency,
        customerIds: query.customerIds,
      },
    );

    assertStoreScope(profileFacts, query.storeId);
    assertStoreScope(allOrderFacts, query.storeId);

    let periodOrderFacts = allOrderFacts;

    if (filter.dateRange) {
      periodOrderFacts = allOrderFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
    }

    return {
      profileFacts,
      allOrderFacts,
      periodOrderFacts,
      filter,
      timezone,
      currency,
    };
  }
}

export const customerReportsService = new CustomerReportsService();
