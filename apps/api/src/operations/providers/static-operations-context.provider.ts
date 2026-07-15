import type { OperationsContext, OperationsContextProvider } from "./operations-context";

const SNAPSHOT_PAGE = 1;
const SNAPSHOT_LIMIT = 100;

export interface StaticOperationsContextProviderDependencies {
  readonly warehouseRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["warehouses"] }>;
  };
  readonly supplierRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["suppliers"] }>;
  };
  readonly shipmentRepository: {
    listByStoreId(storeId: string): Promise<OperationsContext["shipments"]>;
  };
  readonly pickListRepository: {
    listByStoreId(storeId: string): Promise<OperationsContext["pickLists"]>;
  };
  readonly inventoryAllocationRepository: {
    listByStoreId(storeId: string): Promise<OperationsContext["allocations"]>;
  };
  readonly warehouseTransferRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["warehouseTransfers"] }>;
  };
  readonly purchaseOrderRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["purchaseOrders"] }>;
  };
  readonly replenishmentRepository: {
    listRules(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["replenishmentRules"] }>;
    listRecommendations(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["replenishmentRecommendations"] }>;
  };
  readonly inventoryItemRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["inventoryItems"] }>;
  };
  readonly reservationRepository: {
    listByStoreId(storeId: string): Promise<OperationsContext["reservations"]>;
  };
  readonly returnRepository: {
    listByStoreId(storeId: string): Promise<OperationsContext["returns"]>;
  };
  readonly cycleCountRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["cycleCounts"] }>;
  };
  readonly inventoryAdjustmentRepository: {
    list(query: {
      storeId: string;
      page: number;
      limit: number;
    }): Promise<{ items: OperationsContext["inventoryAdjustments"] }>;
  };
}

export class StaticOperationsContextProvider implements OperationsContextProvider {
  constructor(
    private readonly dependencies: StaticOperationsContextProviderDependencies,
  ) {}

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
      this.dependencies.warehouseRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.supplierRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.shipmentRepository.listByStoreId(storeId),
      this.dependencies.pickListRepository.listByStoreId(storeId),
      this.dependencies.inventoryAllocationRepository.listByStoreId(storeId),
      this.dependencies.warehouseTransferRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.purchaseOrderRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.replenishmentRepository.listRules({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.replenishmentRepository.listRecommendations({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.inventoryItemRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.reservationRepository.listByStoreId(storeId),
      this.dependencies.returnRepository.listByStoreId(storeId),
      this.dependencies.cycleCountRepository.list({
        storeId,
        page: SNAPSHOT_PAGE,
        limit: SNAPSHOT_LIMIT,
      }),
      this.dependencies.inventoryAdjustmentRepository.list({
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
