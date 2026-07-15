import type {
  PurchaseOrder,
  PurchaseOrderReceiveResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type {
  ListPurchaseOrdersQuery,
  ReceivePurchaseOrderInput,
} from "@commerceflow/validation";

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import { resolvePurchaseOrderStatusAfterReceive } from "../policies/purchase-order-status-transition.policy";
import type {
  CreatePurchaseOrderItemRecord,
  CreatePurchaseOrderRecord,
  PurchaseOrderRepository,
} from "./purchase-order.repository";

type MutablePurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  productVariantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type MutablePurchaseOrderRecord = {
  id: string;
  storeId: string;
  warehouseId: string;
  supplierId: string;
  purchaseOrderNumber: string;
  status: PurchaseOrder["status"];
  orderedAt?: string;
  receivedAt?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: MutablePurchaseOrderItem[];
};

function toPurchaseOrder(record: MutablePurchaseOrderRecord): PurchaseOrder {
  return {
    ...record,
    items: record.items.map((item) => ({ ...item })),
  };
}

export class MemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly purchaseOrdersById = new Map<string, MutablePurchaseOrderRecord>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
    this.inventoryItemRepository.setTransactionFailure(error);
  }

  async findById(storeId: string, id: string): Promise<PurchaseOrder | null> {
    const record = this.purchaseOrdersById.get(id);
    return record?.storeId === storeId ? toPurchaseOrder(record) : null;
  }

  async list(query: ListPurchaseOrdersQuery) {
    const items = [...this.purchaseOrdersById.values()]
      .filter((record) => record.storeId === query.storeId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map(toPurchaseOrder),
      total: items.length,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreatePurchaseOrderRecord): Promise<PurchaseOrder> {
    const now = new Date().toISOString();
    const purchaseOrderId = crypto.randomUUID();

    const purchaseOrder: MutablePurchaseOrderRecord = {
      id: purchaseOrderId,
      storeId: record.storeId,
      warehouseId: record.warehouseId,
      supplierId: record.supplierId,
      purchaseOrderNumber: record.purchaseOrderNumber,
      status: "draft",
      expectedDeliveryDate: record.expectedDeliveryDate?.toISOString(),
      notes: record.notes,
      items: record.items.map((item) => ({
        id: crypto.randomUUID(),
        purchaseOrderId,
        productVariantId: item.productVariantId,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        unitCost: item.unitCost,
        currency: item.currency,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.purchaseOrdersById.set(purchaseOrderId, purchaseOrder);

    return toPurchaseOrder(purchaseOrder);
  }

  async findDraftByWarehouseAndSupplier(
    storeId: string,
    warehouseId: string,
    supplierId: string,
  ): Promise<PurchaseOrder | null> {
    for (const record of this.purchaseOrdersById.values()) {
      if (
        record.storeId === storeId &&
        record.warehouseId === warehouseId &&
        record.supplierId === supplierId &&
        record.status === "draft"
      ) {
        return toPurchaseOrder(record);
      }
    }

    return null;
  }

  async appendItemsToDraft(
    storeId: string,
    id: string,
    items: readonly CreatePurchaseOrderItemRecord[],
  ): Promise<PurchaseOrder> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const record = this.purchaseOrdersById.get(id);

    if (!record || record.storeId !== storeId || record.status !== "draft") {
      throw new Error(`Purchase order not found: ${id}`);
    }

    const now = new Date().toISOString();

    for (const item of items) {
      const existingItem = record.items.find(
        (line) => line.productVariantId === item.productVariantId,
      );

      if (existingItem) {
        existingItem.quantityOrdered += item.quantityOrdered;
        existingItem.updatedAt = now;
      } else {
        record.items.push({
          id: crypto.randomUUID(),
          purchaseOrderId: id,
          productVariantId: item.productVariantId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unitCost: item.unitCost,
          currency: item.currency,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    record.updatedAt = now;
    this.purchaseOrdersById.set(id, record);
    return toPurchaseOrder(record);
  }

  async approvePurchaseOrder(
    storeId: string,
    id: string,
    approvedAt: Date,
  ): Promise<PurchaseOrder> {
    const existing = this.purchaseOrdersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`PurchaseOrder not found: ${id}`);
    }

    if (existing.status !== "draft") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    existing.status = "approved";
    existing.updatedAt = approvedAt.toISOString();

    return toPurchaseOrder(existing);
  }

  async orderPurchaseOrder(
    storeId: string,
    id: string,
    orderedAt: Date,
  ): Promise<PurchaseOrder> {
    const existing = this.purchaseOrdersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`PurchaseOrder not found: ${id}`);
    }

    if (existing.status !== "approved") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    existing.status = "ordered";
    existing.orderedAt = orderedAt.toISOString();
    existing.updatedAt = orderedAt.toISOString();

    return toPurchaseOrder(existing);
  }

  async receivePurchaseOrder(
    storeId: string,
    id: string,
    input: ReceivePurchaseOrderInput,
    receivedAt: Date,
  ): Promise<PurchaseOrderReceiveResult> {
    const existing = this.purchaseOrdersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`PurchaseOrder not found: ${id}`);
    }

    if (existing.status !== "ordered" && existing.status !== "partially_received") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const stockMovements: PurchaseOrderReceiveResult["stockMovements"][number][] =
      [];
    const snapshots: { inventoryItemId: string; quantityOnHand: number }[] = [];
    const itemSnapshots: { itemId: string; quantityReceived: number }[] = [];

    try {
      for (const update of input.items) {
        const item = existing.items.find(
          (entry) => entry.id === update.purchaseOrderItemId,
        );

        if (!item) {
          throw new Error(`PurchaseOrderItem not found: ${update.purchaseOrderItemId}`);
        }

        const remaining = item.quantityOrdered - item.quantityReceived;

        if (remaining <= 0) {
          throw new Error("ITEM_ALREADY_RECEIVED");
        }

        if (update.quantityReceived > remaining) {
          throw new Error("RECEIPT_EXCEEDS_REMAINING");
        }

        let inventoryItem =
          await this.inventoryItemRepository.findByProductVariantId(
            storeId,
            existing.warehouseId,
            item.productVariantId,
          );

        if (!inventoryItem) {
          const created = await this.inventoryItemRepository.createWithInitialMovement(
            {
              storeId,
              warehouseId: existing.warehouseId,
              productVariantId: item.productVariantId,
              initialQuantity: 0,
            },
          );
          inventoryItem = created.inventoryItem;
        }

        const previousQuantityOnHand = inventoryItem.quantityOnHand;
        const newQuantityOnHand = previousQuantityOnHand + update.quantityReceived;

        snapshots.push({
          inventoryItemId: inventoryItem.id,
          quantityOnHand: previousQuantityOnHand,
        });
        itemSnapshots.push({
          itemId: item.id,
          quantityReceived: item.quantityReceived,
        });

        (inventoryItem as { quantityOnHand: number }).quantityOnHand =
          newQuantityOnHand;
        (inventoryItem as { updatedAt: string }).updatedAt =
          receivedAt.toISOString();

        item.quantityReceived += update.quantityReceived;
        item.updatedAt = receivedAt.toISOString();

        stockMovements.push({
          id: crypto.randomUUID(),
          storeId,
          warehouseId: existing.warehouseId,
          inventoryItemId: inventoryItem.id,
          movementType: "adjustment",
          quantity: update.quantityReceived,
          previousQuantityOnHand,
          newQuantityOnHand,
          reference: existing.purchaseOrderNumber,
          metadata: {
            reason: "purchase_order_receipt",
            purchaseOrderId: existing.id,
            purchaseOrderItemId: item.id,
            purchaseOrderNumber: existing.purchaseOrderNumber,
            unitCost: item.unitCost,
            currency: item.currency,
          },
          createdAt: receivedAt.toISOString(),
        });
      }

      const nextStatus = resolvePurchaseOrderStatusAfterReceive(existing.items);
      existing.status = nextStatus;
      if (nextStatus === "received") {
        existing.receivedAt = receivedAt.toISOString();
      }
      existing.updatedAt = receivedAt.toISOString();

      return {
        purchaseOrder: toPurchaseOrder(existing),
        stockMovements,
      };
    } catch (error) {
      for (const snapshot of snapshots) {
        const inventory = await this.inventoryItemRepository.findById(
          storeId,
          snapshot.inventoryItemId,
        );

        if (inventory) {
          (inventory as { quantityOnHand: number }).quantityOnHand =
            snapshot.quantityOnHand;
        }
      }

      for (const snapshot of itemSnapshots) {
        const item = existing.items.find((entry) => entry.id === snapshot.itemId);
        if (item) {
          item.quantityReceived = snapshot.quantityReceived;
        }
      }

      throw error;
    }
  }

  async cancelPurchaseOrder(
    storeId: string,
    id: string,
  ): Promise<PurchaseOrder> {
    const existing = this.purchaseOrdersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`PurchaseOrder not found: ${id}`);
    }

    if (existing.status !== "draft" && existing.status !== "approved") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    existing.status = "cancelled";
    existing.updatedAt = new Date().toISOString();

    return toPurchaseOrder(existing);
  }
}
