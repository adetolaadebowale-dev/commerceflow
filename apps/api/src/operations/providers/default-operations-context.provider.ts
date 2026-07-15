import type { OperationsContext, OperationsContextProvider } from "./operations-context";
import { getCycleCountRepository } from "@/cycle-counts/repositories";
import { getInventoryAdjustmentRepository } from "@/inventory-adjustments/repositories";
import { getInventoryAllocationRepository } from "@/inventory-allocation/repositories";
import { getInventoryItemRepository } from "@/inventory/repositories";
import { getPickListRepository } from "@/pick-lists/repositories";
import { getPurchaseOrderRepository } from "@/purchase-orders/repositories";
import { getReplenishmentRepository } from "@/replenishment/repositories";
import { getInventoryReservationRepository } from "@/reservations/repositories";
import { getReturnRepository } from "@/returns/repositories";
import { getShipmentRepository } from "@/shipments/repositories";
import { getSupplierRepository } from "@/suppliers/repositories";
import { getWarehouseTransferRepository } from "@/warehouse-transfers/repositories";
import { getWarehouseRepository } from "@/warehouses/repositories";

const SNAPSHOT_PAGE = 1;
const SNAPSHOT_LIMIT = 100;

export class DefaultOperationsContextProvider
  implements OperationsContextProvider
{
  async loadContext(storeId: string): Promise<OperationsContext> {
    const [
      warehouses,
      suppliers,
      shipments,
      pickLists,
      allocations,
      warehouseTransfers,
      purchaseOrders,
      replenishmentRules,
      replenishmentRecommendations,
      inventoryItems,
      reservations,
      returns,
      cycleCounts,
      inventoryAdjustments,
    ] = await Promise.all([
      getWarehouseRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getSupplierRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getShipmentRepository().listByStoreId(storeId),
      getPickListRepository().listByStoreId(storeId),
      getInventoryAllocationRepository().listByStoreId(storeId),
      getWarehouseTransferRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getPurchaseOrderRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getReplenishmentRepository().listRules({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getReplenishmentRepository().listRecommendations({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getInventoryItemRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getInventoryReservationRepository().listByStoreId(storeId),
      getReturnRepository().listByStoreId(storeId),
      getCycleCountRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      getInventoryAdjustmentRepository().list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
    ]);

    return {
      storeId,
      warehouses: warehouses.items,
      suppliers: suppliers.items,
      shipments,
      pickLists,
      allocations,
      warehouseTransfers: warehouseTransfers.items,
      purchaseOrders: purchaseOrders.items,
      replenishmentRules: replenishmentRules.items,
      replenishmentRecommendations: replenishmentRecommendations.items,
      inventoryItems: inventoryItems.items,
      reservations,
      returns,
      cycleCounts: cycleCounts.items,
      inventoryAdjustments: inventoryAdjustments.items,
    };
  }
}
