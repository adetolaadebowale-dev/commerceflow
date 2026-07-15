import {
  type PrismaClient,
  type Return as PrismaReturn,
  type ReturnItem as PrismaReturnItem,
} from "@prisma/client";
import type {
  Return,
  ReturnCompletionResult,
  ReturnItem,
} from "@commerceflow/types";
import { RESTOCKABLE_RETURN_CONDITIONS } from "@commerceflow/types";
import type {
  CompleteReturnInput,
  InspectReturnInput,
  ReceiveReturnInput,
} from "@commerceflow/validation";

import { toStockMovement } from "@/lib/stock-movement-mapper";
import type {
  CreateReturnRecord,
  ReturnRepository,
} from "./return.repository";
import type { InventoryItem as PrismaInventoryItem } from "@prisma/client";

function toInventoryItem(record: PrismaInventoryItem): import("@commerceflow/types").InventoryItem {
  return {
    id: record.id,
    storeId: record.storeId,
    productVariantId: record.productVariantId,
    quantityOnHand: record.quantityOnHand,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

type ReturnWithItems = PrismaReturn & {
  items: PrismaReturnItem[];
};

function toReturnItem(record: PrismaReturnItem): ReturnItem {
  return {
    id: record.id,
    returnId: record.returnId,
    orderItemId: record.orderItemId,
    inventoryItemId: record.inventoryItemId,
    quantityRequested: record.quantityRequested,
    quantityReceived: record.quantityReceived,
    quantityRestocked: record.quantityRestocked,
    condition: record.condition ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toReturn(record: ReturnWithItems): Return {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    shipmentId: record.shipmentId,
    returnNumber: record.returnNumber,
    status: record.status,
    reason: record.reason,
    notes: record.notes ?? undefined,
    requestedAt: record.requestedAt.toISOString(),
    receivedAt: record.receivedAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    items: record.items.map(toReturnItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const itemsInclude = {
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
};

export class PrismaReturnRepository implements ReturnRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Return | null> {
    const record = await this.db.return.findFirst({
      where: { id, storeId },
      include: { items: itemsInclude },
    });

    return record ? toReturn(record) : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Return[]> {
    const records = await this.db.return.findMany({
      where: { storeId, orderId },
      include: { items: itemsInclude },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return records.map(toReturn);
  }

  async sumRequestedQuantityByOrderItemId(
    storeId: string,
    orderItemId: string,
    excludeReturnId?: string,
  ): Promise<number> {
    const result = await this.db.returnItem.aggregate({
      _sum: { quantityRequested: true },
      where: {
        orderItemId,
        return: {
          storeId,
          status: { not: "rejected" },
          ...(excludeReturnId ? { id: { not: excludeReturnId } } : {}),
        },
      },
    });

    return result._sum.quantityRequested ?? 0;
  }

  async create(record: CreateReturnRecord): Promise<Return> {
    const created = await this.db.return.create({
      data: {
        storeId: record.storeId,
        orderId: record.orderId,
        shipmentId: record.shipmentId,
        returnNumber: record.returnNumber,
        reason: record.reason,
        notes: record.notes,
        requestedAt: record.requestedAt,
        items: {
          create: record.items.map((item) => ({
            orderItemId: item.orderItemId,
            inventoryItemId: item.inventoryItemId,
            quantityRequested: item.quantityRequested,
          })),
        },
      },
      include: { items: itemsInclude },
    });

    return toReturn(created);
  }

  async receiveReturn(
    storeId: string,
    returnId: string,
    input: ReceiveReturnInput,
    receivedAt: Date,
  ): Promise<Return> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.return.findFirst({
        where: { id: returnId, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`Return not found: ${returnId}`);
      }

      if (existing.status !== "requested") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      for (const update of input.items) {
        const item = existing.items.find((entry) => entry.id === update.returnItemId);

        if (!item) {
          throw new Error(`ReturnItem not found: ${update.returnItemId}`);
        }

        if (update.quantityReceived > item.quantityRequested) {
          throw new Error("QUANTITY_EXCEEDED");
        }

        await tx.returnItem.update({
          where: { id: update.returnItemId },
          data: { quantityReceived: update.quantityReceived },
        });
      }

      const updated = await tx.return.update({
        where: { id: returnId },
        data: {
          status: "received",
          receivedAt,
        },
        include: { items: itemsInclude },
      });

      return toReturn(updated);
    });
  }

  async inspectReturn(
    storeId: string,
    returnId: string,
    input: InspectReturnInput,
  ): Promise<Return> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.return.findFirst({
        where: { id: returnId, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`Return not found: ${returnId}`);
      }

      if (existing.status !== "received") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      for (const update of input.items) {
        const item = existing.items.find((entry) => entry.id === update.returnItemId);

        if (!item) {
          throw new Error(`ReturnItem not found: ${update.returnItemId}`);
        }

        await tx.returnItem.update({
          where: { id: update.returnItemId },
          data: { condition: update.condition },
        });
      }

      const updated = await tx.return.update({
        where: { id: returnId },
        data: { status: "inspecting" },
        include: { items: itemsInclude },
      });

      return toReturn(updated);
    });
  }

  async completeReturn(
    storeId: string,
    returnId: string,
    _input: CompleteReturnInput,
    completedAt: Date,
  ): Promise<ReturnCompletionResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.return.findFirst({
        where: { id: returnId, storeId },
        include: { items: itemsInclude },
      });

      if (!existing) {
        throw new Error(`Return not found: ${returnId}`);
      }

      if (existing.status !== "inspecting") {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      const stockMovements: ReturnCompletionResult["stockMovements"][number][] = [];
      const inventoryItems: ReturnCompletionResult["inventoryItems"][number][] = [];
      let restockCount = 0;

      for (const item of existing.items) {
        const quantityRestocked =
          item.condition &&
          RESTOCKABLE_RETURN_CONDITIONS.includes(
            item.condition as (typeof RESTOCKABLE_RETURN_CONDITIONS)[number],
          )
            ? item.quantityReceived
            : 0;

        if (quantityRestocked > 0) {
          restockCount += 1;

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

          const newQuantityOnHand = inventory.quantityOnHand + quantityRestocked;
          const updatedInventory = await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: { quantityOnHand: newQuantityOnHand },
          });

          const stockMovement = await tx.stockMovement.create({
            data: {
              storeId,
              inventoryItemId: inventory.id,
              movementType: "return",
              quantity: quantityRestocked,
              previousQuantityOnHand: inventory.quantityOnHand,
              newQuantityOnHand,
              reference: existing.returnNumber,
              metadata: {
                returnId: existing.id,
                returnItemId: item.id,
              },
            },
          });

          await tx.returnItem.update({
            where: { id: item.id },
            data: { quantityRestocked },
          });

          stockMovements.push(toStockMovement(stockMovement));
          inventoryItems.push(toInventoryItem(updatedInventory));
        } else {
          await tx.returnItem.update({
            where: { id: item.id },
            data: { quantityRestocked: 0 },
          });
        }
      }

      const updated = await tx.return.update({
        where: { id: returnId },
        data: {
          status: restockCount > 0 ? "completed" : "rejected",
          completedAt,
        },
        include: { items: itemsInclude },
      });

      return {
        return: toReturn(updated),
        stockMovements,
        inventoryItems,
      };
    });
  }
}
