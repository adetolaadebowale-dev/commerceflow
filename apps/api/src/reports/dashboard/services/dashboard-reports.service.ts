import type {
  DashboardKPIReport,
  ExecutiveDashboard,
} from "@commerceflow/types";
import type {
  DashboardKPIQuery,
  ExecutiveDashboardQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getReportFoundationRepository,
  type ReportFoundationRepository,
} from "../../repositories";
import { buildReportFilter, paginateItems } from "../../services/report-utils";
import {
  getDashboardReportRepository,
  type DashboardReportRepository,
} from "../repositories";
import {
  buildDashboardSections,
  buildExecutiveSummary,
  flattenDashboardKPIs,
} from "./dashboard-aggregation";

export interface DashboardReportsServiceDependencies {
  readonly dashboardReportRepository?: DashboardReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class DashboardReportsService {
  private readonly dashboardReportRepository: DashboardReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: DashboardReportsServiceDependencies = {}) {
    this.dashboardReportRepository =
      dependencies.dashboardReportRepository ?? getDashboardReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getExecutiveDashboard(
    query: ExecutiveDashboardQuery,
  ): Promise<ExecutiveDashboard> {
    const { summaries, filter, timezone, currency } =
      await this.loadSummaries(query);
    const generatedAt = new Date().toISOString();
    const executiveSummary = buildExecutiveSummary(summaries);
    const sections = buildDashboardSections(summaries, executiveSummary);

    const dashboard: ExecutiveDashboard = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      executiveSummary,
      sections,
    };

    this.domainEventPublisher.publishDashboardReportGenerated(
      query.storeId,
      "executive",
      flattenDashboardKPIs(sections).length,
      dashboard,
    );

    return dashboard;
  }

  async getDashboardKPIs(query: DashboardKPIQuery): Promise<DashboardKPIReport> {
    const { summaries, filter, timezone, currency } =
      await this.loadSummaries(query);
    const generatedAt = new Date().toISOString();
    const executiveSummary = buildExecutiveSummary(summaries);
    const sections = buildDashboardSections(summaries, executiveSummary);
    const allKpis = flattenDashboardKPIs(sections);
    const paginated = paginateItems(allKpis, query.page, query.limit);

    const report: DashboardKPIReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      executiveSummary,
      items: paginated.items,
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishDashboardReportGenerated(
      query.storeId,
      "kpis",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadSummaries(query: ExecutiveDashboardQuery) {
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
    const summaries =
      await this.dashboardReportRepository.loadSourceSummaries(query);

    return {
      summaries,
      filter,
      timezone,
      currency,
    };
  }
}

export const dashboardReportsService = new DashboardReportsService();
