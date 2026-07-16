import { getInventoryItemRepository, getStockMovementRepository } from "@/inventory/repositories";
import { getPurchaseOrderRepository } from "@/purchase-orders/repositories";
import { getReplenishmentRepository } from "@/replenishment/repositories";
import { getShipmentRepository } from "@/shipments/repositories";
import { getSupplierRepository } from "@/suppliers/repositories";
import { getWarehouseRepository } from "@/warehouses/repositories";
import { getWarehouseTransferRepository } from "@/warehouse-transfers/repositories";
import {
  mapInventoryItemToFact,
  mapPurchaseOrderToFact,
  mapReplenishmentRecommendationToFact,
  mapShipmentToFact,
  mapStockMovementToFact,
  mapSupplierToFact,
  mapWarehouseToFact,
  mapWarehouseTransferToFact,
} from "../mappers/procurement-fact.mapper";
import type {
  ListProcurementFactsQuery,
  ProcurementReportRepository,
} from "./procurement-report.repository";

const REPORTING_PAGE_SIZE = 100;

export class DefaultProcurementReportRepository implements ProcurementReportRepository {
  constructor(
    private readonly purchaseOrderRepository = getPurchaseOrderRepository(),
    private readonly supplierRepository = getSupplierRepository(),
    private readonly warehouseRepository = getWarehouseRepository(),
    private readonly replenishmentRepository = getReplenishmentRepository(),
    private readonly warehouseTransferRepository = getWarehouseTransferRepository(),
    private readonly stockMovementRepository = getStockMovementRepository(),
    private readonly inventoryItemRepository = getInventoryItemRepository(),
    private readonly shipmentRepository = getShipmentRepository(),
  ) {}

  async listPurchaseOrderFacts(query: ListProcurementFactsQuery) {
    const purchaseOrders = await this.loadAllPurchaseOrders(query);
    let facts = purchaseOrders.map(mapPurchaseOrderToFact);

    if (query.supplierIds && query.supplierIds.length > 0) {
      const allowed = new Set(query.supplierIds);
      facts = facts.filter((fact) => allowed.has(fact.supplierId));
    }

    if (query.currency) {
      facts = facts.filter((fact) =>
        fact.items.every((item) => item.currency === query.currency),
      );
    }

    return facts;
  }

  async listSupplierFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const suppliers = await this.loadAllSuppliers(query.storeId);
    return suppliers.map(mapSupplierToFact);
  }

  async listWarehouseFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const warehouses = await this.loadAllWarehouses(query.storeId);
    return warehouses.map(mapWarehouseToFact);
  }

  async listReplenishmentRecommendationFacts(
    query: Pick<ListProcurementFactsQuery, "storeId" | "supplierIds">,
  ) {
    const recommendations = await this.loadAllRecommendations(query.storeId);
    let facts = recommendations.map(mapReplenishmentRecommendationToFact);

    if (query.supplierIds && query.supplierIds.length > 0) {
      const allowed = new Set(query.supplierIds);
      facts = facts.filter((fact) => allowed.has(fact.supplierId));
    }

    return facts;
  }

  async listWarehouseTransferFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ) {
    const transfers = await this.loadAllTransfers(query.storeId);
    return transfers.map(mapWarehouseTransferToFact);
  }

  async listStockMovementFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ) {
    const [movements, inventoryItems] = await Promise.all([
      this.loadAllStockMovements(query.storeId),
      this.loadAllInventoryItems(query.storeId),
    ]);
    const variantByItemId = new Map(
      inventoryItems.map((item) => [item.id, item.productVariantId]),
    );

    return movements.map((movement) =>
      mapStockMovementToFact(
        movement,
        variantByItemId.get(movement.inventoryItemId) ?? "unknown",
      ),
    );
  }

  async listInventoryFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const inventoryItems = await this.loadAllInventoryItems(query.storeId);
    return inventoryItems.map(mapInventoryItemToFact);
  }

  async listShipmentFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const shipments = await this.shipmentRepository.listByStoreId(query.storeId);
    return shipments.map(mapShipmentToFact);
  }

  private async loadAllPurchaseOrders(query: ListProcurementFactsQuery) {
    const purchaseOrders = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (purchaseOrders.length < total) {
      const result = await this.purchaseOrderRepository.list({
        storeId: query.storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      purchaseOrders.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    if (query.purchaseOrderStatus) {
      return purchaseOrders.filter(
        (purchaseOrder) => purchaseOrder.status === query.purchaseOrderStatus,
      );
    }

    return purchaseOrders;
  }

  private async loadAllSuppliers(storeId: string) {
    const suppliers = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (suppliers.length < total) {
      const result = await this.supplierRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      suppliers.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return suppliers;
  }

  private async loadAllWarehouses(storeId: string) {
    const warehouses = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (warehouses.length < total) {
      const result = await this.warehouseRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      warehouses.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return warehouses;
  }

  private async loadAllRecommendations(storeId: string) {
    const recommendations = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (recommendations.length < total) {
      const result = await this.replenishmentRepository.listRecommendations({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      recommendations.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return recommendations;
  }

  private async loadAllTransfers(storeId: string) {
    const transfers = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (transfers.length < total) {
      const result = await this.warehouseTransferRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      transfers.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return transfers;
  }

  private async loadAllStockMovements(storeId: string) {
    const movements = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (movements.length < total) {
      const result = await this.stockMovementRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      movements.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return movements;
  }

  private async loadAllInventoryItems(storeId: string) {
    const items = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (items.length < total) {
      const result = await this.inventoryItemRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      items.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return items;
  }
}

const procurementReportRepository = new DefaultProcurementReportRepository();

export function getProcurementReportRepository(): ProcurementReportRepository {
  return procurementReportRepository;
}
