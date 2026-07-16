import type {
  FinancialSummary,
  InvoiceReport,
  PaymentReport,
  RefundReport,
  RevenueTimelineReport,
} from "@commerceflow/types";
import type {
  FinancialSummaryQuery,
  InvoiceReportQuery,
  PaymentReportQuery,
  RefundReportQuery,
  RevenueTimelineQuery,
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
import {
  mapInvoiceFactToReportRow,
  mapPaymentFactToReportRow,
  mapRefundFactToReportRow,
} from "../mappers/financial-report.mapper";
import {
  getFinancialReportRepository,
  type FinancialReportRepository,
} from "../repositories";
import type {
  InvoiceFact,
  PaymentFact,
  RefundFact,
} from "../repositories/financial-report.repository";
import {
  buildDiscountSummary,
  buildFinancialMetrics,
  buildInvoiceSummary,
  buildPaymentSummary,
  buildRefundSummary,
  buildRevenueTimelinePoints,
  buildShippingRevenueSummary,
  buildTaxSummary,
} from "./financial-aggregation";

export interface FinancialReportsServiceDependencies {
  readonly financialReportRepository?: FinancialReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class FinancialReportsService {
  private readonly financialReportRepository: FinancialReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: FinancialReportsServiceDependencies = {}) {
    this.financialReportRepository =
      dependencies.financialReportRepository ?? getFinancialReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getSummary(query: FinancialSummaryQuery): Promise<FinancialSummary> {
    const {
      orderFacts,
      invoiceFacts,
      paymentFacts,
      refundFacts,
      filter,
      timezone,
      currency,
    } = await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();

    const summary: FinancialSummary = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      metrics: buildFinancialMetrics(
        orderFacts,
        invoiceFacts,
        paymentFacts,
        refundFacts,
        currency,
      ),
      paymentSummary: buildPaymentSummary(paymentFacts, currency),
      invoiceSummary: buildInvoiceSummary(invoiceFacts, currency),
      refundSummary: buildRefundSummary(refundFacts, currency),
      taxSummary: buildTaxSummary(orderFacts, currency),
      discountSummary: buildDiscountSummary(orderFacts, currency),
      shippingRevenueSummary: buildShippingRevenueSummary(orderFacts, currency),
    };

    this.domainEventPublisher.publishFinancialReportGenerated(
      query.storeId,
      "summary",
      orderFacts.length,
      summary,
    );

    return summary;
  }

  async getRevenueTimeline(
    query: RevenueTimelineQuery,
  ): Promise<RevenueTimelineReport> {
    const { orderFacts, refundFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const points = buildRevenueTimelinePoints(
      orderFacts,
      refundFacts,
      timezone,
      query.granularity,
      currency,
    );

    const report: RevenueTimelineReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      granularity: query.granularity,
      filter,
      points,
    };

    this.domainEventPublisher.publishFinancialReportGenerated(
      query.storeId,
      "revenue",
      points.length,
      report,
    );

    return report;
  }

  async getPaymentReport(query: PaymentReportQuery): Promise<PaymentReport> {
    const { paymentFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const summary = buildPaymentSummary(paymentFacts, currency);
    const sorted = sortItems(
      paymentFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: PaymentReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      summary,
      items: paginated.items.map((fact) =>
        mapPaymentFactToReportRow(fact as PaymentFact),
      ),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishFinancialReportGenerated(
      query.storeId,
      "payments",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getInvoiceReport(query: InvoiceReportQuery): Promise<InvoiceReport> {
    const { invoiceFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const summary = buildInvoiceSummary(invoiceFacts, currency);
    const sorted = sortItems(
      invoiceFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: InvoiceReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      summary,
      items: paginated.items.map((fact) =>
        mapInvoiceFactToReportRow(fact as InvoiceFact),
      ),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishFinancialReportGenerated(
      query.storeId,
      "invoices",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getRefundReport(query: RefundReportQuery): Promise<RefundReport> {
    const { refundFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query);
    const generatedAt = new Date().toISOString();
    const summary = buildRefundSummary(refundFacts, currency);
    const sorted = sortItems(
      refundFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: RefundReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter: { ...filter, currency },
      summary,
      items: paginated.items.map((fact) =>
        mapRefundFactToReportRow(fact as RefundFact),
      ),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishFinancialReportGenerated(
      query.storeId,
      "refunds",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadFilteredFacts(
    query:
      | FinancialSummaryQuery
      | RevenueTimelineQuery
      | PaymentReportQuery
      | InvoiceReportQuery
      | RefundReportQuery,
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

    const orderFacts = await this.financialReportRepository.listOrderFacts({
      storeId: query.storeId,
      orderStatus: "orderStatus" in query ? query.orderStatus : undefined,
      currency: query.currency,
    });
    const invoiceFacts = await this.financialReportRepository.listInvoiceFacts({
      storeId: query.storeId,
      currency: query.currency,
      invoiceStatus: "invoiceStatus" in query ? query.invoiceStatus : undefined,
    });
    const paymentFacts = await this.financialReportRepository.listPaymentFacts({
      storeId: query.storeId,
      currency: query.currency,
      paymentStatus: "paymentStatus" in query ? query.paymentStatus : undefined,
    });
    const refundFacts = await this.financialReportRepository.listRefundFacts({
      storeId: query.storeId,
      currency: query.currency,
    });

    assertStoreScope(orderFacts, query.storeId);
    assertStoreScope(invoiceFacts, query.storeId);
    assertStoreScope(paymentFacts, query.storeId);
    assertStoreScope(refundFacts, query.storeId);

    let filteredOrderFacts = filterByWarehouseIds(orderFacts, filter.warehouseIds);
    let filteredInvoiceFacts = invoiceFacts;
    let filteredPaymentFacts = paymentFacts;
    let filteredRefundFacts = refundFacts;

    if (filter.dateRange) {
      filteredOrderFacts = filteredOrderFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
      filteredInvoiceFacts = filteredInvoiceFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
      filteredPaymentFacts = filteredPaymentFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
      filteredRefundFacts = filteredRefundFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
    }

    if ("paymentStatus" in query && query.paymentStatus) {
      filteredOrderFacts = filteredOrderFacts.filter(
        (fact) => fact.paymentStatus === query.paymentStatus,
      );
    }

    return {
      orderFacts: filteredOrderFacts,
      invoiceFacts: filteredInvoiceFacts,
      paymentFacts: filteredPaymentFacts,
      refundFacts: filteredRefundFacts,
      filter,
      timezone,
      currency,
    };
  }
}

export const financialReportsService = new FinancialReportsService();
