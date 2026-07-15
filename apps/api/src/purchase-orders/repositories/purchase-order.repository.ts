import type {
  CatalogueListResult,
  PurchaseOrder,
  PurchaseOrderReceiveResult,
} from "@commerceflow/types";
import type {
  ListPurchaseOrdersQuery,
  ReceivePurchaseOrderInput,
} from "@commerceflow/validation";

export interface CreatePurchaseOrderItemRecord {
  readonly productVariantId: string;
  readonly quantityOrdered: number;
  readonly unitCost: string;
  readonly currency: string;
}

export interface CreatePurchaseOrderRecord {
  readonly storeId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly purchaseOrderNumber: string;
  readonly expectedDeliveryDate?: Date;
  readonly notes?: string;
  readonly items: readonly CreatePurchaseOrderItemRecord[];
}

export interface PurchaseOrderRepository {
  findById(storeId: string, id: string): Promise<PurchaseOrder | null>;
  list(query: ListPurchaseOrdersQuery): Promise<CatalogueListResult<PurchaseOrder>>;
  create(record: CreatePurchaseOrderRecord): Promise<PurchaseOrder>;
  findDraftByWarehouseAndSupplier(
    storeId: string,
    warehouseId: string,
    supplierId: string,
  ): Promise<PurchaseOrder | null>;
  appendItemsToDraft(
    storeId: string,
    id: string,
    items: readonly CreatePurchaseOrderItemRecord[],
  ): Promise<PurchaseOrder>;
  approvePurchaseOrder(
    storeId: string,
    id: string,
    approvedAt: Date,
  ): Promise<PurchaseOrder>;
  orderPurchaseOrder(
    storeId: string,
    id: string,
    orderedAt: Date,
  ): Promise<PurchaseOrder>;
  receivePurchaseOrder(
    storeId: string,
    id: string,
    input: ReceivePurchaseOrderInput,
    receivedAt: Date,
  ): Promise<PurchaseOrderReceiveResult>;
  cancelPurchaseOrder(storeId: string, id: string): Promise<PurchaseOrder>;
}
