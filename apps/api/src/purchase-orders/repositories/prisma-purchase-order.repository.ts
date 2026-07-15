import {
  type PurchaseOrder as PrismaPurchaseOrder,
  type PurchaseOrderItem as PrismaPurchaseOrderItem,
  type PrismaClient,
} from "@prisma/client";
import type {
  CatalogueListResult,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderReceiveResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type {
  ListPurchaseOrdersQuery,
  ReceivePurchaseOrderInput,
} from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import { resolvePurchaseOrderStatusAfterReceive } from "../policies/purchase-order-status-transition.policy";
import type {
  CreatePurchaseOrderItemRecord,
  CreatePurchaseOrderRecord,
  PurchaseOrderRepository,
} from "./purchase-order.repository";

type PurchaseOrderWithItems = PrismaPurchaseOrder & {
  items: PrismaPurchaseOrderItem[];
};

function toPurchaseOrderItem(record: PrismaPurchaseOrderItem): PurchaseOrderItem {
  return {
    id: record.id,
    purchaseOrderId: record.purchaseOrderId,
    productVariantId: record.productVariantId,
    quantityOrdered: record.quantityOrdered,
    quantityReceived: record.quantityReceived,
    unitCost: record.unitCost.toString(),
    currency: record.currency,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPurchaseOrder(record: PurchaseOrderWithItems): PurchaseOrder {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    supplierId: record.supplierId,
    purchaseOrderNumber: record.purchaseOrderNumber,
    status: record.status,
    orderedAt: record.orderedAt?.toISOString(),
    receivedAt: record.receivedAt?.toISOString(),
    expectedDeliveryDate: record.expectedDeliveryDate?.toISOString(),
    notes: record.notes ?? undefined,
    items: record.items.map(toPurchaseOrderItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const itemsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
};

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<PurchaseOrder | null> {
    const record = await this.db.purchaseOrder.findFirst({
      where: { id, storeId },
      include: { items: itemsInclude },
    });

    return record ? toPurchaseOrder(record) : null;
  }

  async list(
    query: ListPurchaseOrdersQuery,
  ): Promise<CatalogueListResult<PurchaseOrder>> {
    const where = { storeId: query.storeId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.purchaseOrder.findMany({
        where,
        include: { items: itemsInclude },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
      }),
      this.db.purchaseOrder.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toPurchaseOrder),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreatePurchaseOrderRecord): Promise<PurchaseOrder> {
    const created = await this.db.purchaseOrder.create({
      data: {
        storeId: record.storeId,
        warehouseId: record.warehouseId,
        supplierId: record.supplierId,
        purchaseOrderNumber: record.purchaseOrderNumber,
        expectedDeliveryDate: record.expectedDeliveryDate,
        notes: record.notes,
        items: {
          create: record.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            currency: item.currency,
          })),
        },
      },
      include: { items: itemsInclude },
    });

    return toPurchaseOrder(created);
  }

  async findDraftByWarehouseAndSupplier(
    storeId: string,
    warehouseId: string,
    supplierId: string,
  ): Promise<PurchaseOrder | null> {
    const record = await this.db.purchaseOrder.findFirst({
      where: {
        storeId,
        warehouseId,
        supplierId,
        status: "draft",
      },
      include: { items: itemsInclude },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return record ? toPurchaseOrder(record) : null;
  }

  async appendItemsToDraft(
    storeId: string,
    id: string,
    items: readonly CreatePurchaseOrderItemRecord[],
  ): Promise<PurchaseOrder> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, storeId, status: "draft" },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`Purchase order not found: ${id}`);
      }

      for (const item of items) {
        const existingItem = existing.items.find(
          (line) => line.productVariantId === item.productVariantId,
        );

        if (existingItem) {
          await tx.purchaseOrderItem.update({
            where: { id: existingItem.id },
            data: {
              quantityOrdered:
                existingItem.quantityOrdered + item.quantityOrdered,
            },
          });
        } else {
          await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: id,
              productVariantId: item.productVariantId,
              quantityOrdered: item.quantityOrdered,
              unitCost: item.unitCost,
              currency: item.currency,
            },
          });
        }
      }

      const updated = await tx.purchaseOrder.findFirstOrThrow({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      return toPurchaseOrder(updated);
    });
  }

  async approvePurchaseOrder(
    storeId: string,
    id: string,
    _approvedAt: Date,
  ): Promise<PurchaseOrder> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`PurchaseOrder not found: ${id}`);
      }

      if (existing.status !== "draft") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: "approved" },
        include: { items: itemsInclude },
      });

      return toPurchaseOrder(updated);
    });
  }

  async orderPurchaseOrder(
    storeId: string,
    id: string,
    orderedAt: Date,
  ): Promise<PurchaseOrder> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`PurchaseOrder not found: ${id}`);
      }

      if (existing.status !== "approved") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "ordered",
          orderedAt,
        },
        include: { items: itemsInclude },
      });

      return toPurchaseOrder(updated);
    });
  }

  async receivePurchaseOrder(
    storeId: string,
    id: string,
    input: ReceivePurchaseOrderInput,
    receivedAt: Date,
  ): Promise<PurchaseOrderReceiveResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`PurchaseOrder not found: ${id}`);
      }

      if (existing.status !== "ordered" && existing.status !== "partially_received") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const stockMovements: PurchaseOrderReceiveResult["stockMovements"][number][] =
        [];

      for (const update of input.items) {
        const item = existing.items.find((entry) => entry.id === update.purchaseOrderItemId);

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

        let inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            storeId,
            warehouseId: existing.warehouseId,
            productVariantId: item.productVariantId,
            deletedAt: null,
          },
        });

        if (!inventoryItem) {
          inventoryItem = await tx.inventoryItem.create({
            data: {
              storeId,
              warehouseId: existing.warehouseId,
              productVariantId: item.productVariantId,
              quantityOnHand: 0,
            },
          });
        }

        const previousQuantityOnHand = inventoryItem.quantityOnHand;
        const newQuantityOnHand = previousQuantityOnHand + update.quantityReceived;

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantityOnHand: newQuantityOnHand },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
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
              unitCost: item.unitCost.toString(),
              currency: item.currency,
            },
          },
        });

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            quantityReceived: item.quantityReceived + update.quantityReceived,
          },
        });

        item.quantityReceived += update.quantityReceived;
        stockMovements.push(toStockMovement(stockMovement));
      }

      const nextStatus = resolvePurchaseOrderStatusAfterReceive(existing.items);
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          receivedAt: nextStatus === "received" ? receivedAt : existing.receivedAt,
        },
        include: { items: itemsInclude },
      });

      return {
        purchaseOrder: toPurchaseOrder(updated),
        stockMovements,
      };
    });
  }

  async cancelPurchaseOrder(
    storeId: string,
    id: string,
  ): Promise<PurchaseOrder> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`PurchaseOrder not found: ${id}`);
      }

      if (existing.status !== "draft" && existing.status !== "approved") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: "cancelled" },
        include: { items: itemsInclude },
      });

      return toPurchaseOrder(updated);
    });
  }
}
