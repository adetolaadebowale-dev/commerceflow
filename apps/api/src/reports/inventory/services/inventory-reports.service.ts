import type {
  InventoryMovementReport,
  InventorySummary,
  InventoryValuationReport,
  LowStockReport,
} from "@commerceflow/types";
import type {
  InventoryLowStockQuery,
  InventoryMovementQuery,
  InventorySummaryQuery,
  InventoryValuationQuery,
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
  sumCurrencyAmounts,
} from "../../services/report-utils";
import {
  getInventoryReportRepository,
  type InventoryReportRepository,
} from "../repositories";
import type {
  InventoryItemFact,
  InventoryMovementFact,
} from "../repositories/inventory-report.repository";
import {
  buildAdjustmentSummary,
  buildInventoryMetrics,
  buildLowStockItems,
  buildMovementTotals,
  buildOutOfStockItems,
  buildValuationItems,
  buildVariantBreakdowns,
  buildWarehouseBreakdowns,
  mapMovementFactsToRows,
} from "./inventory-aggregation";

export interface InventoryReportsServiceDependencies {
  readonly inventoryReportRepository?: InventoryReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class InventoryReportsService {
  private readonly inventoryReportRepository: InventoryReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: InventoryReportsServiceDependencies = {}) {
    this.inventoryReportRepository =
      dependencies.inventoryReportRepository ?? getInventoryReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getSummary(query: InventorySummaryQuery): Promise<InventorySummary> {
    const { itemFacts, movementFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query, { movements: true });
    const generatedAt = new Date().toISOString();
    const lowStockItems = buildLowStockItems(itemFacts);
    const outOfStockItems = buildOutOfStockItems(itemFacts);

    const summary: InventorySummary = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      metrics: buildInventoryMetrics(itemFacts, movementFacts, currency),
      byWarehouse: buildWarehouseBreakdowns(itemFacts),
      byProductVariant: buildVariantBreakdowns(itemFacts),
      lowStockItems,
      outOfStockItems,
      adjustmentReport: buildAdjustmentSummary(movementFacts),
    };

    this.domainEventPublisher.publishInventoryReportGenerated(
      query.storeId,
      "summary",
      itemFacts.length,
      summary,
    );

    return summary;
  }

  async getStockMovements(
    query: InventoryMovementQuery,
  ): Promise<InventoryMovementReport> {
    const { movementFacts, filter, timezone } = await this.loadFilteredMovements(
      query,
    );
    const generatedAt = new Date().toISOString();
    const sorted = sortItems(
      movementFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);
    const items = mapMovementFactsToRows(
      paginated.items as readonly InventoryMovementFact[],
    );

    const report: InventoryMovementReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      items,
      pagination: paginated.pagination,
      totals: buildMovementTotals(movementFacts),
    };

    this.domainEventPublisher.publishInventoryReportGenerated(
      query.storeId,
      "movements",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getLowStockReport(query: InventoryLowStockQuery): Promise<LowStockReport> {
    const { itemFacts, filter, timezone } = await this.loadFilteredFacts(query, {
      movements: false,
    });
    const generatedAt = new Date().toISOString();
    const lowStockItems = buildLowStockItems(itemFacts);
    const outOfStockItems = buildOutOfStockItems(itemFacts);
    const combined = [...lowStockItems, ...outOfStockItems];
    const paginated = paginateItems(combined, query.page, query.limit);

    const report: LowStockReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      lowStockItems,
      outOfStockItems,
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishInventoryReportGenerated(
      query.storeId,
      "low_stock",
      lowStockItems.length + outOfStockItems.length,
      report,
    );

    return report;
  }

  async getValuation(
    query: InventoryValuationQuery,
  ): Promise<InventoryValuationReport> {
    const { itemFacts, filter, timezone, currency } =
      await this.loadFilteredFacts(query, { movements: false });
    const generatedAt = new Date().toISOString();
    const valuationItems = buildValuationItems(itemFacts);
    const sorted = sortItems(
      itemFacts.map((fact) => ({
        ...fact,
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginatedFacts = paginateItems(sorted, query.page, query.limit);
    const paginatedIds = new Set(
      paginatedFacts.items.map((fact) => (fact as InventoryItemFact).inventoryItemId),
    );
    const paginatedItems = valuationItems.filter((item) =>
      paginatedIds.has(item.inventoryItemId),
    );

    const report: InventoryValuationReport = {
      storeId: query.storeId,
      generatedAt,
      timezone,
      filter,
      items: paginatedItems,
      pagination: paginatedFacts.pagination,
      totalValue: sumCurrencyAmounts(
        valuationItems.map((item) => item.inventoryValue),
      ),
      currency,
    };

    this.domainEventPublisher.publishInventoryReportGenerated(
      query.storeId,
      "valuation",
      paginatedFacts.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadFilteredFacts(
    query:
      | InventorySummaryQuery
      | InventoryLowStockQuery
      | InventoryValuationQuery,
    options: { readonly movements: boolean },
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

    const itemFacts = await this.inventoryReportRepository.listItemFacts({
      storeId: query.storeId,
    });
    assertStoreScope(itemFacts, query.storeId);

    const filteredItems = this.applyInventoryFilters(itemFacts, query, filter);
    const movementFacts = options.movements
      ? await this.loadFilteredMovementFacts(query.storeId, filter, query)
      : [];

    return {
      itemFacts: filteredItems,
      movementFacts,
      filter,
      timezone,
      currency,
    };
  }

  private async loadFilteredMovements(query: InventoryMovementQuery) {
    const context = await this.reportFoundationRepository.getStoreReportingContext(
      query.storeId,
    );
    const filter = buildReportFilter(query, {
      defaultTimezone: context.defaultTimezone,
      defaultCurrency: context.defaultCurrency,
      activeWarehouseIds: context.activeWarehouseIds,
    });
    const timezone = filter.dateRange?.timezone ?? context.defaultTimezone;
    const movementFacts = await this.loadFilteredMovementFacts(
      query.storeId,
      filter,
      query,
    );

    return {
      movementFacts,
      filter,
      timezone,
    };
  }

  private async loadFilteredMovementFacts(
    storeId: string,
    filter: ReturnType<typeof buildReportFilter>,
    query: {
      warehouseIds?: readonly string[];
      productVariantIds?: readonly string[];
      supplierIds?: readonly string[];
      movementType?: InventoryMovementQuery["movementType"];
    },
  ) {
    let movementFacts = await this.inventoryReportRepository.listMovementFacts({
      storeId,
      movementType: "movementType" in query ? query.movementType : undefined,
    });

    assertStoreScope(movementFacts, storeId);

    if (filter.warehouseIds && filter.warehouseIds.length > 0) {
      const allowed = new Set(filter.warehouseIds);
      movementFacts = movementFacts.filter((fact) =>
        allowed.has(fact.warehouseId),
      );
    }

    if (query.productVariantIds && query.productVariantIds.length > 0) {
      const allowed = new Set(query.productVariantIds);
      movementFacts = movementFacts.filter((fact) =>
        allowed.has(fact.productVariantId),
      );
    }

    if (filter.dateRange) {
      movementFacts = movementFacts.filter((fact) =>
        isWithinDateRange(fact.reportTimestamp, filter.dateRange!),
      );
    }

    return movementFacts;
  }

  private applyInventoryFilters(
    facts: readonly InventoryItemFact[],
    query: {
      productVariantIds?: readonly string[];
      supplierIds?: readonly string[];
    },
    filter: ReturnType<typeof buildReportFilter>,
  ): readonly InventoryItemFact[] {
    let filtered = filterByWarehouseIds(
      facts.map((fact) => ({ ...fact, warehouseId: fact.warehouseId })),
      filter.warehouseIds,
    ) as InventoryItemFact[];

    if (query.productVariantIds && query.productVariantIds.length > 0) {
      const allowed = new Set(query.productVariantIds);
      filtered = filtered.filter((fact) => allowed.has(fact.productVariantId));
    }

    if (query.supplierIds && query.supplierIds.length > 0) {
      const allowed = new Set(query.supplierIds);
      filtered = filtered.filter(
        (fact) => fact.supplierId !== undefined && allowed.has(fact.supplierId),
      );
    }

    return filtered;
  }
}

export const inventoryReportsService = new InventoryReportsService();
