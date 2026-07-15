import type {
  CycleCount,
  InventoryAdjustment,
  InventoryAllocation,
  InventoryItem,
  InventoryReservation,
  PickList,
  PurchaseOrder,
  ReplenishmentRecommendation,
  ReplenishmentRule,
  Return,
  Shipment,
  Supplier,
  Warehouse,
  WarehouseTransfer,
} from "@commerceflow/types";

/** Read-only snapshot of operational domain state for a store. */
export interface OperationsContext {
  readonly storeId: string;
  readonly warehouses: readonly Warehouse[];
  readonly suppliers: readonly Supplier[];
  readonly shipments: readonly Shipment[];
  readonly pickLists: readonly PickList[];
  readonly allocations: readonly InventoryAllocation[];
  readonly warehouseTransfers: readonly WarehouseTransfer[];
  readonly purchaseOrders: readonly PurchaseOrder[];
  readonly replenishmentRules: readonly ReplenishmentRule[];
  readonly replenishmentRecommendations: readonly ReplenishmentRecommendation[];
  readonly inventoryItems: readonly InventoryItem[];
  readonly reservations: readonly InventoryReservation[];
  readonly returns: readonly Return[];
  readonly cycleCounts: readonly CycleCount[];
  readonly inventoryAdjustments: readonly InventoryAdjustment[];
}

export interface OperationsContextProvider {
  loadContext(storeId: string): Promise<OperationsContext>;
}
