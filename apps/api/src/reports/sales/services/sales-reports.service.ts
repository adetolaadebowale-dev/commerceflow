import type {
  SalesOrdersReport,
  SalesSummary,
  SalesTimelineReport,
} from "@commerceflow/types";
import type {
  SalesOrderReportQuery,
  SalesSummaryQuery,
  SalesTimelineQuery,
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
  filterByWarehouseIds,
  isWithinDateRange,
  paginateItems,
  sortItems,
} from "../../services/report-utils";
import { mapSalesOrderFactToReport } from "../mappers/sales-report.mapper";
import {
  getSalesReportRepository,
  type SalesReportRepository,
} from "../repositories";
import type { SalesOrderFact } from "../repositories/sales-report.repository";
import {
  buildFinancialMetrics,
  buildPeriodBreakdowns,
  buildStatusBreakdowns,
  buildTimelinePoints,
  buildWarehouseBreakdowns,
} from "./sales-aggregation";

export interface SalesReportsServiceDependencies {
  readonly salesReportRepository?: SalesReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class SalesReportsService {
  private readonly salesReportRepository: SalesReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: SalesReportsServiceDependencies = {}) {
    this.salesReportRepository =
      dependencies.salesReportRepository ?? getSalesReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getSummary(query: SalesSummaryQuery): Promise<SalesSummary> {
    const { filteredFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const metrics = buildFinancialMetrics(filteredFacts, currency);

    const summary: SalesSummary = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      metrics,
      byDay: buildPeriodBreakdowns(filteredFacts, timezone, "day", currency),
      byWeek: buildPeriodBreakdowns(filteredFacts, timezone, "week", currency),
      byMonth: buildPeriodBreakdowns(filteredFacts, timezone, "month", currency),
      byOrderStatus: buildStatusBreakdowns(filteredFacts, "orderStatus"),
      byPaymentStatus: buildStatusBreakdowns(filteredFacts, "paymentStatus"),
      byStore: buildStatusBreakdowns(filteredFacts, "storeId"),
      byWarehouse: buildWarehouseBreakdowns(filteredFacts),
    };

    this.domainEventPublisher.publishSalesReportGenerated(
      query.storeId,
      "summary",
      metrics.orderCount,
      summary,
    );

    return summary;
  }

  async getTimeline(query: SalesTimelineQuery): Promise<SalesTimelineReport> {
    const { filteredFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const points = buildTimelinePoints(
      filteredFacts,
      timezone,
      query.granularity,
      currency,
    );

    const report: SalesTimelineReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      granularity: query.granularity,
      filter,
      points,
    };

    this.domainEventPublisher.publishSalesReportGenerated(
      query.storeId,
      "timeline",
      points.reduce((total, point) => total + point.metrics.orderCount, 0),
      report,
    );

    return report;
  }

  async listOrders(query: SalesOrderReportQuery): Promise<SalesOrdersReport> {
    const { filteredFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const sorted = sortItems(
      filteredFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);
    const items = paginated.items.map((fact) =>
      mapSalesOrderFactToReport(fact as SalesOrderFact),
    );

    const report: SalesOrdersReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      items,
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishSalesReportGenerated(
      query.storeId,
      "orders",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadFilteredFacts(
    query: SalesSummaryQuery | SalesTimelineQuery | SalesOrderReportQuery,
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
    const facts = await this.salesReportRepository.listOrderFacts({
      storeId: query.storeId,
      orderStatus: query.orderStatus,
      currency: query.currency,
    });

    assertStoreScope(facts, query.storeId);

    let filteredFacts = facts;

    if (filter.dateRange) {
      filteredFacts = filteredFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
    }

    filteredFacts = filterByWarehouseIds(filteredFacts, filter.warehouseIds);

    return {
      filteredFacts,
      filter,
      timezone,
      currency,
    };
  }
}

export const salesReportsService = new SalesReportsService();
