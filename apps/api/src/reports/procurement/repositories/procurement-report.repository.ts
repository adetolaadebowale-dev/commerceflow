import type {
  PurchaseOrderStatus,
  ReplenishmentRecommendationStatus,
  ShipmentStatus,
  WarehouseTransferStatus,
} from "@commerceflow/types";

/** Read-only purchase order line fact for procurement reporting. */
export interface PurchaseOrderLineFact {
  readonly lineId: string;
  readonly purchaseOrderId: string;
  readonly productVariantId: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly unitCost: string;
  readonly currency: string;
}

/** Read-only purchase order fact for procurement reporting. */
export interface PurchaseOrderFact {
  readonly purchaseOrderId: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly purchaseOrderNumber: string;
  readonly status: PurchaseOrderStatus;
  readonly orderedAt?: string;
  readonly receivedAt?: string;
  readonly expectedDeliveryDate?: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly items: readonly PurchaseOrderLineFact[];
}

/** Read-only supplier fact for procurement reporting. */
export interface SupplierFact {
  readonly supplierId: string;
  readonly storeId: string;
  readonly name: string;
  readonly code: string;
  readonly currency: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Read-only warehouse fact for procurement reporting. */
export interface WarehouseFact {
  readonly warehouseId: string;
  readonly storeId: string;
  readonly name: string;
  readonly code: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Read-only replenishment recommendation fact. */
export interface ReplenishmentRecommendationFact {
  readonly recommendationId: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly productVariantId: string;
  readonly recommendedQuantity: number;
  readonly currentQuantity: number;
  readonly reorderPoint: number;
  readonly status: ReplenishmentRecommendationStatus;
  readonly purchaseOrderId?: string;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Read-only warehouse transfer fact. */
export interface WarehouseTransferFact {
  readonly transferId: string;
  readonly storeId: string;
  readonly transferNumber: string;
  readonly sourceWarehouseId: string;
  readonly destinationWarehouseId: string;
  readonly status: WarehouseTransferStatus;
  readonly quantity: number;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly approvedAt?: string;
  readonly shippedAt?: string;
  readonly receivedAt?: string;
}

/** Read-only stock movement fact for throughput analytics. */
export interface ProcurementStockMovementFact {
  readonly movementId: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly inventoryItemId: string;
  readonly productVariantId: string;
  readonly quantity: number;
  readonly reportTimestamp: string;
  readonly createdAt: string;
}

/** Read-only inventory snapshot for turnover analytics. */
export interface ProcurementInventoryFact {
  readonly inventoryItemId: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
}

/** Read-only shipment fact for fulfillment analytics. */
export interface ProcurementShipmentFact {
  readonly shipmentId: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly warehouseId?: string;
  readonly status: ShipmentStatus;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly shippedAt?: string;
  readonly deliveredAt?: string;
  readonly fulfilledAt?: string;
}

export interface ListProcurementFactsQuery {
  readonly storeId: string;
  readonly purchaseOrderStatus?: PurchaseOrderStatus;
  readonly supplierIds?: readonly string[];
  readonly currency?: string;
}

export interface ProcurementReportRepository {
  listPurchaseOrderFacts(
    query: ListProcurementFactsQuery,
  ): Promise<readonly PurchaseOrderFact[]>;
  listSupplierFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly SupplierFact[]>;
  listWarehouseFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly WarehouseFact[]>;
  listReplenishmentRecommendationFacts(
    query: Pick<ListProcurementFactsQuery, "storeId" | "supplierIds">,
  ): Promise<readonly ReplenishmentRecommendationFact[]>;
  listWarehouseTransferFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly WarehouseTransferFact[]>;
  listStockMovementFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly ProcurementStockMovementFact[]>;
  listInventoryFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly ProcurementInventoryFact[]>;
  listShipmentFacts(
    query: Pick<ListProcurementFactsQuery, "storeId">,
  ): Promise<readonly ProcurementShipmentFact[]>;
}
