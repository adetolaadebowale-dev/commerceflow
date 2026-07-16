import type {
  DashboardMetric,
  ReportDashboardResponse,
  ReportHealthResponse,
  ReportSummary,
} from "@commerceflow/types";
import type {
  ReportDashboardQuery,
  ReportHealthQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getReportFoundationRepository,
  type ReportFoundationRepository,
} from "../repositories";
import {
  REPORT_FOUNDATION_FEATURES,
  REPORT_FOUNDATION_VERSION,
  buildReportFilter,
  paginateItems,
} from "./report-utils";

export interface ReportsServiceDependencies {
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ReportsService {
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ReportsServiceDependencies = {}) {
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getHealth(_query: ReportHealthQuery): Promise<ReportHealthResponse> {
    return {
      status: "ok",
      version: REPORT_FOUNDATION_VERSION,
      supportedFeatures: [...REPORT_FOUNDATION_FEATURES],
    };
  }

  async getDashboard(query: ReportDashboardQuery): Promise<ReportDashboardResponse> {
    const context = await this.reportFoundationRepository.getStoreReportingContext(
      query.storeId,
    );
    const filter = buildReportFilter(query, {
      defaultTimezone: context.defaultTimezone,
      defaultCurrency: context.defaultCurrency,
      activeWarehouseIds: context.activeWarehouseIds,
    });
    const generatedAt = new Date().toISOString();
    const placeholderRows = this.buildPlaceholderRows(query, context);
    const paginated = paginateItems(placeholderRows, query.page, query.limit);
    const summary: ReportSummary = {
      storeId: query.storeId,
      generatedAt,
      filter,
      rowCount: paginated.pagination.totalItems,
    };
    const metrics = this.buildPlaceholderMetrics(context, paginated.pagination);

    const response: ReportDashboardResponse = {
      storeId: query.storeId,
      generatedAt,
      timezone: filter.dateRange?.timezone ?? context.defaultTimezone,
      currency: filter.currency ?? context.defaultCurrency,
      metrics,
      summary,
    };

    this.domainEventPublisher.publishReportsGenerated(query.storeId, response);
    this.domainEventPublisher.publishDashboardViewed(query.storeId, response);

    return response;
  }

  private buildPlaceholderRows(
    query: ReportDashboardQuery,
    context: {
      readonly defaultTimezone: string;
      readonly activeWarehouseIds: readonly string[];
    },
  ): readonly Record<string, string | number>[] {
    const warehouseIds =
      query.warehouseIds && query.warehouseIds.length > 0
        ? query.warehouseIds
        : context.activeWarehouseIds;

    if (warehouseIds.length === 0) {
      return [
        {
          storeId: query.storeId,
          generatedAt: new Date().toISOString(),
          metricKey: "foundation_ready",
          metricValue: 1,
        },
      ];
    }

    return warehouseIds.map((warehouseId, index) => ({
      storeId: query.storeId,
      warehouseId,
      generatedAt: new Date(Date.now() - index * 60_000).toISOString(),
      metricKey: "foundation_ready",
      metricValue: 1,
    }));
  }

  private buildPlaceholderMetrics(
    context: {
      readonly defaultTimezone: string;
      readonly defaultCurrency: string;
      readonly activeWarehouseIds: readonly string[];
    },
    pagination: { readonly totalItems: number; readonly totalPages: number },
  ): readonly DashboardMetric[] {
    return [
      {
        key: "active_warehouses",
        label: "Active Warehouses",
        value: context.activeWarehouseIds.length,
      },
      {
        key: "report_rows",
        label: "Placeholder Report Rows",
        value: pagination.totalItems,
      },
      {
        key: "report_pages",
        label: "Report Pages",
        value: pagination.totalPages,
      },
      {
        key: "foundation_version",
        label: "Reporting Foundation Version",
        value: REPORT_FOUNDATION_VERSION,
      },
      {
        key: "currency",
        label: "Reporting Currency",
        value: context.defaultCurrency,
        currency: context.defaultCurrency,
      },
      {
        key: "timezone",
        label: "Reporting Timezone",
        value: context.defaultTimezone,
        unit: "timezone",
      },
    ];
  }
}

export const reportsService = new ReportsService();
