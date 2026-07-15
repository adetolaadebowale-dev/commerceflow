import {
  type WarehouseTransfer as PrismaWarehouseTransfer,
  type WarehouseTransferItem as PrismaWarehouseTransferItem,
  type PrismaClient,
} from "@prisma/client";
import type {
  CatalogueListResult,
  WarehouseTransfer,
  WarehouseTransferItem,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type { ListWarehouseTransfersQuery } from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import type {
  CreateWarehouseTransferRecord,
  WarehouseTransferRepository,
} from "./warehouse-transfer.repository";

type WarehouseTransferWithItems = PrismaWarehouseTransfer & {
  items: PrismaWarehouseTransferItem[];
};

function toWarehouseTransferItem(
  record: PrismaWarehouseTransferItem,
): WarehouseTransferItem {
  return {
    id: record.id,
    warehouseTransferId: record.warehouseTransferId,
    inventoryItemId: record.inventoryItemId,
    quantity: record.quantity,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toWarehouseTransfer(record: WarehouseTransferWithItems): WarehouseTransfer {
  return {
    id: record.id,
    storeId: record.storeId,
    transferNumber: record.transferNumber,
    sourceWarehouseId: record.sourceWarehouseId,
    destinationWarehouseId: record.destinationWarehouseId,
    status: record.status,
    notes: record.notes ?? undefined,
    approvedAt: record.approvedAt?.toISOString(),
    shippedAt: record.shippedAt?.toISOString(),
    receivedAt: record.receivedAt?.toISOString(),
    items: record.items.map(toWarehouseTransferItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const itemsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
};

export class PrismaWarehouseTransferRepository
  implements WarehouseTransferRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<WarehouseTransfer | null> {
    const record = await this.db.warehouseTransfer.findFirst({
      where: { id, storeId },
      include: { items: itemsInclude },
    });

    return record ? toWarehouseTransfer(record) : null;
  }

  async list(
    query: ListWarehouseTransfersQuery,
  ): Promise<CatalogueListResult<WarehouseTransfer>> {
    const where = { storeId: query.storeId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.warehouseTransfer.findMany({
        where,
        include: { items: itemsInclude },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: query.limit,
      }),
      this.db.warehouseTransfer.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toWarehouseTransfer),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateWarehouseTransferRecord): Promise<WarehouseTransfer> {
    const created = await this.db.warehouseTransfer.create({
      data: {
        storeId: record.storeId,
        transferNumber: record.transferNumber,
        sourceWarehouseId: record.sourceWarehouseId,
        destinationWarehouseId: record.destinationWarehouseId,
        notes: record.notes,
        items: {
          create: record.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: itemsInclude },
    });

    return toWarehouseTransfer(created);
  }

  async approveWarehouseTransfer(
    storeId: string,
    id: string,
    approvedAt: Date,
  ): Promise<WarehouseTransfer> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.warehouseTransfer.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`WarehouseTransfer not found: ${id}`);
      }

      if (existing.status !== "draft") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      for (const item of existing.items) {
        const inventory = await tx.inventoryItem.findFirst({
          where: {
            id: item.inventoryItemId,
            storeId,
            deletedAt: null,
          },
        });

        if (!inventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        if (inventory.quantityOnHand < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const updated = await tx.warehouseTransfer.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt,
        },
        include: { items: itemsInclude },
      });

      return toWarehouseTransfer(updated);
    });
  }

  async shipWarehouseTransfer(
    storeId: string,
    id: string,
    shippedAt: Date,
  ): Promise<WarehouseTransferShipResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.warehouseTransfer.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`WarehouseTransfer not found: ${id}`);
      }

      if (existing.status !== "approved") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const stockMovements: WarehouseTransferShipResult["stockMovements"][number][] =
        [];

      for (const item of existing.items) {
        const inventory = await tx.inventoryItem.findFirst({
          where: {
            id: item.inventoryItemId,
            storeId,
            deletedAt: null,
          },
        });

        if (!inventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        const newQuantityOnHand = inventory.quantityOnHand - item.quantity;

        if (newQuantityOnHand < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.inventoryItem.update({
          where: { id: inventory.id },
          data: { quantityOnHand: newQuantityOnHand },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
            storeId,
            warehouseId: existing.sourceWarehouseId,
            inventoryItemId: inventory.id,
            movementType: "transfer",
            quantity: -item.quantity,
            previousQuantityOnHand: inventory.quantityOnHand,
            newQuantityOnHand,
            reference: existing.transferNumber,
            metadata: {
              warehouseTransferId: existing.id,
              warehouseTransferItemId: item.id,
              transferNumber: existing.transferNumber,
              sourceWarehouseId: existing.sourceWarehouseId,
              destinationWarehouseId: existing.destinationWarehouseId,
              direction: "outbound",
            },
          },
        });

        stockMovements.push(toStockMovement(stockMovement));
      }

      const updated = await tx.warehouseTransfer.update({
        where: { id },
        data: {
          status: "in_transit",
          shippedAt,
        },
        include: { items: itemsInclude },
      });

      return {
        warehouseTransfer: toWarehouseTransfer(updated),
        stockMovements,
      };
    });
  }

  async receiveWarehouseTransfer(
    storeId: string,
    id: string,
    receivedAt: Date,
  ): Promise<WarehouseTransferReceiveResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.warehouseTransfer.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`WarehouseTransfer not found: ${id}`);
      }

      if (existing.status !== "in_transit") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const stockMovements: WarehouseTransferReceiveResult["stockMovements"][number][] =
        [];

      for (const item of existing.items) {
        const sourceInventory = await tx.inventoryItem.findFirst({
          where: {
            id: item.inventoryItemId,
            storeId,
            deletedAt: null,
          },
        });

        if (!sourceInventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        let destinationInventory = await tx.inventoryItem.findFirst({
          where: {
            storeId,
            warehouseId: existing.destinationWarehouseId,
            productVariantId: sourceInventory.productVariantId,
            deletedAt: null,
          },
        });

        if (!destinationInventory) {
          destinationInventory = await tx.inventoryItem.create({
            data: {
              storeId,
              warehouseId: existing.destinationWarehouseId,
              productVariantId: sourceInventory.productVariantId,
              quantityOnHand: 0,
            },
          });
        }

        const newQuantityOnHand =
          destinationInventory.quantityOnHand + item.quantity;

        await tx.inventoryItem.update({
          where: { id: destinationInventory.id },
          data: { quantityOnHand: newQuantityOnHand },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
            storeId,
            warehouseId: existing.destinationWarehouseId,
            inventoryItemId: destinationInventory.id,
            movementType: "transfer",
            quantity: item.quantity,
            previousQuantityOnHand: destinationInventory.quantityOnHand,
            newQuantityOnHand,
            reference: existing.transferNumber,
            metadata: {
              warehouseTransferId: existing.id,
              warehouseTransferItemId: item.id,
              transferNumber: existing.transferNumber,
              sourceWarehouseId: existing.sourceWarehouseId,
              destinationWarehouseId: existing.destinationWarehouseId,
              direction: "inbound",
            },
          },
        });

        stockMovements.push(toStockMovement(stockMovement));
      }

      const updated = await tx.warehouseTransfer.update({
        where: { id },
        data: {
          status: "received",
          receivedAt,
        },
        include: { items: itemsInclude },
      });

      return {
        warehouseTransfer: toWarehouseTransfer(updated),
        stockMovements,
      };
    });
  }

  async cancelWarehouseTransfer(
    storeId: string,
    id: string,
  ): Promise<WarehouseTransfer> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.warehouseTransfer.findFirst({
        where: { id, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`WarehouseTransfer not found: ${id}`);
      }

      if (existing.status !== "draft" && existing.status !== "approved") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const updated = await tx.warehouseTransfer.update({
        where: { id },
        data: { status: "cancelled" },
        include: { items: itemsInclude },
      });

      return toWarehouseTransfer(updated);
    });
  }
}
