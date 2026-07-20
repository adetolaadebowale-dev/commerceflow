import type {
  ProcurementSummary,
  PurchaseOrderAnalytics,
  ReplenishmentAnalytics,
  SupplierAnalytics,
  WarehouseAnalytics,
} from "@commerceflow/types";
import type {
  ProcurementSummaryQuery,
  PurchaseOrderAnalyticsQuery,
  ReplenishmentAnalyticsQuery,
  SupplierAnalyticsQuery,
  WarehouseAnalyticsQuery,
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
  mapPurchaseOrderFactToRow,
  mapReplenishmentFactToRow,
  mapSupplierFactToRow,
  mapWarehouseFactToRow,
} from "../mappers/procurement-report.mapper";
import {
  getProcurementReportRepository,
  type ProcurementReportRepository,
} from "../repositories";
import type {
  ProcurementShipmentFact,
  ProcurementStockMovementFact,
  PurchaseOrderFact,
  ReplenishmentRecommendationFact,
  SupplierFact,
  WarehouseFact,
  WarehouseTransferFact,
} from "../repositories/procurement-report.repository";
import {
  buildFulfillmentAnalytics,
  buildProcurementMetrics,
  buildPurchaseOrderAnalyticsSummary,
  buildReceivingAnalytics,
  buildReplenishmentMetrics,
  buildSupplierAnalyticsSummary,
  buildTransferAnalytics,
  buildWarehouseAnalyticsSummary,
  computeSupplierOnTimeReceivingRate,
  computeSupplierPurchaseVolume,
  computeWarehouseFulfillmentVolume,
  computeWarehouseInventoryTurnover,
  computeWarehouseThroughput,
  computeWarehouseTransferVolume,
} from "./procurement-aggregation";

export interface ProcurementReportsServiceDependencies {
  readonly procurementReportRepository?: ProcurementReportRepository;
  readonly reportFoundationRepository?: ReportFoundationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

function filterBySupplierIds<
  T extends { readonly supplierId?: string },
>(items: readonly T[], supplierIds: readonly string[] | undefined): readonly T[] {
  if (!supplierIds || supplierIds.length === 0) {
    return items;
  }

  const allowed = new Set(supplierIds);
  return items.filter(
    (item) => item.supplierId !== undefined && allowed.has(item.supplierId),
  );
}

function filterFactsByDateRange<
  T extends { readonly reportTimestamp: string },
>(
  items: readonly T[],
  dateRange: NonNullable<ReturnType<typeof buildReportFilter>["dateRange"]>,
): readonly T[] {
  return items.filter((item) => isWithinDateRange(item.reportTimestamp, dateRange));
}

export class ProcurementReportsService {
  private readonly procurementReportRepository: ProcurementReportRepository;
  private readonly reportFoundationRepository: ReportFoundationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ProcurementReportsServiceDependencies = {}) {
    this.procurementReportRepository =
      dependencies.procurementReportRepository ?? getProcurementReportRepository();
    this.reportFoundationRepository =
      dependencies.reportFoundationRepository ?? getReportFoundationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getSummary(query: ProcurementSummaryQuery): Promise<ProcurementSummary> {
    const facts = await this.loadFilteredFacts(query, {
      purchaseOrders: true,
      suppliers: true,
      warehouses: true,
      recommendations: true,
      transfers: true,
      movements: true,
      inventory: true,
      shipments: true,
    });
    const generatedAt = new Date().toISOString();

    const summary: ProcurementSummary = {
      storeId: query.storeId,
      generatedAt,
      timezone: facts.timezone,
      filter: facts.filter,
      metrics: buildProcurementMetrics(
        facts.purchaseOrderFacts,
        facts.transferFacts,
        facts.recommendationFacts,
        facts.shipmentFacts,
        facts.currency,
      ),
      purchaseOrderAnalytics: buildPurchaseOrderAnalyticsSummary(
        facts.purchaseOrderFacts,
        facts.currency,
      ),
      supplierPerformance: buildSupplierAnalyticsSummary(
        facts.supplierFacts,
        facts.purchaseOrderFacts,
        facts.currency,
      ),
      warehousePerformance: buildWarehouseAnalyticsSummary(
        facts.warehouseFacts,
        facts.movementFacts,
        facts.inventoryFacts,
        facts.transferFacts,
        facts.shipmentFacts,
      ),
      transferAnalytics: buildTransferAnalytics(facts.transferFacts),
      replenishmentAnalytics: buildReplenishmentMetrics(facts.recommendationFacts),
      receivingAnalytics: buildReceivingAnalytics(facts.purchaseOrderFacts),
      fulfillmentAnalytics: buildFulfillmentAnalytics(facts.shipmentFacts),
    };

    this.domainEventPublisher.publishProcurementReportGenerated(
      query.storeId,
      "summary",
      facts.purchaseOrderFacts.length,
      summary,
    );

    return summary;
  }

  async getPurchaseOrderAnalytics(
    query: PurchaseOrderAnalyticsQuery,
  ): Promise<PurchaseOrderAnalytics> {
    const facts = await this.loadFilteredFacts(query, { purchaseOrders: true });
    const generatedAt = new Date().toISOString();
    const summary = buildPurchaseOrderAnalyticsSummary(
      facts.purchaseOrderFacts,
      facts.currency,
    );
    const sorted = sortItems(
      facts.purchaseOrderFacts.map((fact) => ({
        ...mapPurchaseOrderFactToRow(fact),
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: PurchaseOrderAnalytics = {
      storeId: query.storeId,
      generatedAt,
      timezone: facts.timezone,
      filter: facts.filter,
      summary,
      items: paginated.items.map((row) => ({
        purchaseOrderId: row.purchaseOrderId,
        purchaseOrderNumber: row.purchaseOrderNumber,
        supplierId: row.supplierId,
        warehouseId: row.warehouseId,
        status: row.status,
        totalValue: row.totalValue,
        quantityOrdered: row.quantityOrdered,
        quantityReceived: row.quantityReceived,
        currency: row.currency,
        reportTimestamp: row.reportTimestamp,
        orderedAt: row.orderedAt,
        receivedAt: row.receivedAt,
        expectedDeliveryDate: row.expectedDeliveryDate,
        createdAt: row.createdAt,
      })),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishProcurementReportGenerated(
      query.storeId,
      "purchase_orders",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getSupplierAnalytics(
    query: SupplierAnalyticsQuery,
  ): Promise<SupplierAnalytics> {
    const facts = await this.loadFilteredFacts(query, {
      purchaseOrders: true,
      suppliers: true,
    });
    const generatedAt = new Date().toISOString();
    const summary = buildSupplierAnalyticsSummary(
      facts.supplierFacts,
      facts.purchaseOrderFacts,
      facts.currency,
    );
    const rows = facts.supplierFacts.map((supplier) =>
      mapSupplierFactToRow(supplier, {
        purchaseOrderCount: facts.purchaseOrderFacts.filter(
          (fact) => fact.supplierId === supplier.supplierId,
        ).length,
        purchaseVolume: computeSupplierPurchaseVolume(
          supplier.supplierId,
          facts.purchaseOrderFacts,
        ),
        onTimeReceivingRate: computeSupplierOnTimeReceivingRate(
          supplier.supplierId,
          facts.purchaseOrderFacts,
        ),
      }),
    );
    const sorted = sortItems(
      rows.map((row) => ({ ...row, generatedAt: row.reportTimestamp })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: SupplierAnalytics = {
      storeId: query.storeId,
      generatedAt,
      timezone: facts.timezone,
      filter: facts.filter,
      summary,
      items: paginated.items.map((row) => ({
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        supplierCode: row.supplierCode,
        purchaseOrderCount: row.purchaseOrderCount,
        purchaseVolume: row.purchaseVolume,
        onTimeReceivingRate: row.onTimeReceivingRate,
        currency: row.currency,
        reportTimestamp: row.reportTimestamp,
      })),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishProcurementReportGenerated(
      query.storeId,
      "suppliers",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getWarehouseAnalytics(
    query: WarehouseAnalyticsQuery,
  ): Promise<WarehouseAnalytics> {
    const facts = await this.loadFilteredFacts(query, {
      purchaseOrders: true,
      warehouses: true,
      transfers: true,
      movements: true,
      inventory: true,
      shipments: true,
    });
    const generatedAt = new Date().toISOString();
    const summary = buildWarehouseAnalyticsSummary(
      facts.warehouseFacts,
      facts.movementFacts,
      facts.inventoryFacts,
      facts.transferFacts,
      facts.shipmentFacts,
    );
    const rows = facts.warehouseFacts.map((warehouse) =>
      mapWarehouseFactToRow(warehouse, {
        throughput: computeWarehouseThroughput(
          warehouse.warehouseId,
          facts.movementFacts,
        ),
        inventoryTurnover: computeWarehouseInventoryTurnover(
          warehouse.warehouseId,
          facts.movementFacts,
          facts.inventoryFacts,
        ),
        transferVolume: computeWarehouseTransferVolume(
          warehouse.warehouseId,
          facts.transferFacts,
        ),
        purchaseOrderCount: facts.purchaseOrderFacts.filter(
          (fact) => fact.warehouseId === warehouse.warehouseId,
        ).length,
        fulfillmentVolume: computeWarehouseFulfillmentVolume(
          warehouse.warehouseId,
          facts.shipmentFacts,
        ),
      }),
    );
    const sorted = sortItems(
      rows.map((row) => ({ ...row, generatedAt: row.reportTimestamp })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: WarehouseAnalytics = {
      storeId: query.storeId,
      generatedAt,
      timezone: facts.timezone,
      filter: facts.filter,
      summary,
      items: paginated.items.map((row) => ({
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        warehouseCode: row.warehouseCode,
        throughput: row.throughput,
        inventoryTurnover: row.inventoryTurnover,
        transferVolume: row.transferVolume,
        purchaseOrderCount: row.purchaseOrderCount,
        fulfillmentVolume: row.fulfillmentVolume,
        reportTimestamp: row.reportTimestamp,
      })),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishProcurementReportGenerated(
      query.storeId,
      "warehouses",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  async getReplenishmentAnalytics(
    query: ReplenishmentAnalyticsQuery,
  ): Promise<ReplenishmentAnalytics> {
    const facts = await this.loadFilteredFacts(query, {
      recommendations: true,
    });
    const generatedAt = new Date().toISOString();
    const summary = buildReplenishmentMetrics(facts.recommendationFacts);
    const sorted = sortItems(
      facts.recommendationFacts.map((fact) => ({
        ...mapReplenishmentFactToRow(fact),
        generatedAt: fact.reportTimestamp,
      })),
      query.sortBy,
      query.sortDirection,
    );
    const paginated = paginateItems(sorted, query.page, query.limit);

    const report: ReplenishmentAnalytics = {
      storeId: query.storeId,
      generatedAt,
      timezone: facts.timezone,
      filter: facts.filter,
      summary,
      items: paginated.items.map((row) => ({
        recommendationId: row.recommendationId,
        warehouseId: row.warehouseId,
        supplierId: row.supplierId,
        productVariantId: row.productVariantId,
        recommendedQuantity: row.recommendedQuantity,
        currentQuantity: row.currentQuantity,
        reorderPoint: row.reorderPoint,
        status: row.status,
        purchaseOrderId: row.purchaseOrderId,
        reportTimestamp: row.reportTimestamp,
        createdAt: row.createdAt,
      })),
      pagination: paginated.pagination,
    };

    this.domainEventPublisher.publishProcurementReportGenerated(
      query.storeId,
      "replenishment",
      paginated.pagination.totalItems,
      report,
    );

    return report;
  }

  private async loadFilteredFacts(
    query:
      | ProcurementSummaryQuery
      | PurchaseOrderAnalyticsQuery
      | SupplierAnalyticsQuery
      | WarehouseAnalyticsQuery
      | ReplenishmentAnalyticsQuery,
    needed: {
      readonly purchaseOrders?: boolean;
      readonly suppliers?: boolean;
      readonly warehouses?: boolean;
      readonly recommendations?: boolean;
      readonly transfers?: boolean;
      readonly movements?: boolean;
      readonly inventory?: boolean;
      readonly shipments?: boolean;
    },
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

    const [
      purchaseOrderFacts,
      supplierFacts,
      warehouseFacts,
      recommendationFacts,
      transferFacts,
      movementFacts,
      inventoryFacts,
      shipmentFacts,
    ] = await Promise.all([
      needed.purchaseOrders
        ? this.procurementReportRepository.listPurchaseOrderFacts({
            storeId: query.storeId,
            purchaseOrderStatus: query.purchaseOrderStatus,
            supplierIds: query.supplierIds,
            currency: query.currency,
          })
        : Promise.resolve([] as const),
      needed.suppliers
        ? this.procurementReportRepository.listSupplierFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
      needed.warehouses
        ? this.procurementReportRepository.listWarehouseFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
      needed.recommendations
        ? this.procurementReportRepository.listReplenishmentRecommendationFacts({
            storeId: query.storeId,
            supplierIds: query.supplierIds,
          })
        : Promise.resolve([] as const),
      needed.transfers
        ? this.procurementReportRepository.listWarehouseTransferFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
      needed.movements
        ? this.procurementReportRepository.listStockMovementFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
      needed.inventory
        ? this.procurementReportRepository.listInventoryFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
      needed.shipments
        ? this.procurementReportRepository.listShipmentFacts({
            storeId: query.storeId,
          })
        : Promise.resolve([] as const),
    ]);

    assertStoreScope(purchaseOrderFacts, query.storeId);
    assertStoreScope(supplierFacts, query.storeId);
    assertStoreScope(warehouseFacts, query.storeId);
    assertStoreScope(recommendationFacts, query.storeId);
    assertStoreScope(transferFacts, query.storeId);
    assertStoreScope(movementFacts, query.storeId);
    assertStoreScope(inventoryFacts, query.storeId);
    assertStoreScope(shipmentFacts, query.storeId);

    let filteredPurchaseOrders = filterByWarehouseIds(
      purchaseOrderFacts,
      filter.warehouseIds,
    );
    let filteredRecommendations = filterByWarehouseIds(
      recommendationFacts,
      filter.warehouseIds,
    );
    let filteredTransfers = filterTransfersByWarehouse(
      transferFacts,
      filter.warehouseIds,
    );
    let filteredMovements = filterByWarehouseIds(
      movementFacts,
      filter.warehouseIds,
    );
    const filteredInventory = filterByWarehouseIds(
      inventoryFacts,
      filter.warehouseIds,
    );
    let filteredShipments = filterByWarehouseIds(
      shipmentFacts,
      filter.warehouseIds,
    );
    const filteredSuppliers = filterBySupplierIds(
      supplierFacts,
      query.supplierIds,
    );

    if (filter.dateRange) {
      filteredPurchaseOrders = filterFactsByDateRange(
        filteredPurchaseOrders,
        filter.dateRange,
      );
      filteredRecommendations = filterFactsByDateRange(
        filteredRecommendations,
        filter.dateRange,
      );
      filteredTransfers = filterFactsByDateRange(
        filteredTransfers,
        filter.dateRange,
      );
      filteredMovements = filterFactsByDateRange(
        filteredMovements,
        filter.dateRange,
      );
      filteredShipments = filterFactsByDateRange(
        filteredShipments,
        filter.dateRange,
      );
    }

    if (query.supplierIds && query.supplierIds.length > 0) {
      filteredPurchaseOrders = filterBySupplierIds(
        filteredPurchaseOrders,
        query.supplierIds,
      );
    }

    return {
      purchaseOrderFacts: filteredPurchaseOrders,
      supplierFacts: filteredSuppliers,
      warehouseFacts: filterWarehousesByScope(
        warehouseFacts,
        filter.warehouseIds,
      ),
      recommendationFacts: filteredRecommendations,
      transferFacts: filteredTransfers,
      movementFacts: filteredMovements,
      inventoryFacts: filteredInventory,
      shipmentFacts: filteredShipments,
      filter,
      timezone,
      currency,
    };
  }
}

function filterTransfersByWarehouse(
  transfers: readonly WarehouseTransferFact[],
  warehouseIds: readonly string[] | undefined,
): readonly WarehouseTransferFact[] {
  if (!warehouseIds || warehouseIds.length === 0) {
    return transfers;
  }

  const allowed = new Set(warehouseIds);
  return transfers.filter(
    (transfer) =>
      allowed.has(transfer.sourceWarehouseId) ||
      allowed.has(transfer.destinationWarehouseId),
  );
}

function filterWarehousesByScope(
  warehouses: readonly WarehouseFact[],
  warehouseIds: readonly string[] | undefined,
): readonly WarehouseFact[] {
  if (!warehouseIds || warehouseIds.length === 0) {
    return warehouses;
  }

  const allowed = new Set(warehouseIds);
  return warehouses.filter((warehouse) => allowed.has(warehouse.warehouseId));
}

export const procurementReportsService = new ProcurementReportsService();

export type {
  PurchaseOrderFact,
  ReplenishmentRecommendationFact,
  SupplierFact,
  WarehouseFact,
  WarehouseTransferFact,
  ProcurementStockMovementFact,
  ProcurementShipmentFact,
};
