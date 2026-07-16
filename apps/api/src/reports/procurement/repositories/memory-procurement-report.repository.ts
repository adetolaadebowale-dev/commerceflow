import type {
  InventoryItem,
  PurchaseOrder,
  ReplenishmentRecommendation,
  Shipment,
  StockMovement,
  Supplier,
  Warehouse,
  WarehouseTransfer,
} from "@commerceflow/types";

import { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { MemorySupplierRepository } from "@/suppliers/repositories/memory-supplier.repository";
import { MemoryWarehouseRepository } from "@/warehouses/repositories/memory-warehouse.repository";
import { MemoryWarehouseTransferRepository } from "@/warehouse-transfers/repositories/memory-warehouse-transfer.repository";
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

export class MemoryProcurementReportRepository implements ProcurementReportRepository {
  constructor(
    private readonly purchaseOrderRepository: MemoryPurchaseOrderRepository,
    private readonly supplierRepository: MemorySupplierRepository,
    private readonly warehouseRepository: MemoryWarehouseRepository,
    private readonly replenishmentRepository: MemoryReplenishmentRepository,
    private readonly warehouseTransferRepository: MemoryWarehouseTransferRepository,
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
    private readonly shipmentRepository: MemoryShipmentRepository,
  ) {}

  async listPurchaseOrderFacts(query: ListProcurementFactsQuery) {
    const result = await this.purchaseOrderRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    let facts = result.items.map(mapPurchaseOrderToFact);

    if (query.purchaseOrderStatus) {
      facts = facts.filter((fact) => fact.status === query.purchaseOrderStatus);
    }

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
    const result = await this.supplierRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    return result.items.map(mapSupplierToFact);
  }

  async listWarehouseFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const result = await this.warehouseRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    return result.items.map(mapWarehouseToFact);
  }

  async listReplenishmentRecommendationFacts(
    query: Pick<ListProcurementFactsQuery, "storeId" | "supplierIds">,
  ) {
    const result = await this.replenishmentRepository.listRecommendations({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    let facts = result.items.map(mapReplenishmentRecommendationToFact);

    if (query.supplierIds && query.supplierIds.length > 0) {
      const allowed = new Set(query.supplierIds);
      facts = facts.filter((fact) => allowed.has(fact.supplierId));
    }

    return facts;
  }

  async listWarehouseTransferFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ) {
    const result = await this.warehouseTransferRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    return result.items.map(mapWarehouseTransferToFact);
  }

  async listStockMovementFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ) {
    const inventoryItems = await this.inventoryItemRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });
    const variantByItemId = new Map(
      inventoryItems.items.map((item) => [item.id, item.productVariantId]),
    );
    const movements = this.inventoryItemRepository
      .getAllMovements()
      .filter((movement) => movement.storeId === query.storeId);

    return movements.map((movement) =>
      mapStockMovementToFact(
        movement,
        variantByItemId.get(movement.inventoryItemId) ?? "unknown",
      ),
    );
  }

  async listInventoryFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const result = await this.inventoryItemRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });

    return result.items.map(mapInventoryItemToFact);
  }

  async listShipmentFacts(query: Pick<ListProcurementFactsQuery, "storeId">) {
    const shipments = await this.shipmentRepository.listByStoreId(query.storeId);
    return shipments.map(mapShipmentToFact);
  }

  seedPurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.purchaseOrderRepository.seedPurchaseOrder(purchaseOrder);
  }

  seedSupplier(supplier: Supplier): void {
    this.supplierRepository.seedSupplier(supplier);
  }

  seedWarehouse(warehouse: Warehouse): void {
    this.warehouseRepository.seedWarehouse(warehouse);
  }

  seedRecommendation(recommendation: ReplenishmentRecommendation): void {
    this.replenishmentRepository.seedRecommendation(recommendation);
  }

  seedWarehouseTransfer(transfer: WarehouseTransfer): void {
    this.warehouseTransferRepository.seedWarehouseTransfer(transfer);
  }

  seedInventoryItem(item: InventoryItem): void {
    this.inventoryItemRepository.seedInventoryItem(item);
  }

  seedStockMovement(movement: StockMovement): void {
    this.inventoryItemRepository.seedStockMovement(movement);
  }

  seedShipment(shipment: Shipment): void {
    this.shipmentRepository.seedShipment(shipment);
  }
}
