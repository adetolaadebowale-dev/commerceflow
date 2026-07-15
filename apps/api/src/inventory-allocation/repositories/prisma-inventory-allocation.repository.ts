import {
  type InventoryAllocation as PrismaInventoryAllocation,
  type PrismaClient,
} from "@prisma/client";
import type { InventoryAllocation } from "@commerceflow/types";

import type { CreateInventoryAllocationRecord } from "./inventory-allocation-create-record";
import type {
  ReportInventoryAllocationShortageRecord,
  UpdateInventoryAllocationPickedRecord,
} from "./inventory-allocation-create-record";
import type { InventoryAllocationRepository } from "./inventory-allocation.repository";

function toInventoryAllocation(
  record: PrismaInventoryAllocation,
): InventoryAllocation {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    pickListItemId: record.pickListItemId,
    inventoryItemId: record.inventoryItemId,
    quantityAllocated: record.quantityAllocated,
    quantityPicked: record.quantityPicked,
    status: record.status,
    shortageReason: record.shortageReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaInventoryAllocationRepository
  implements InventoryAllocationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<InventoryAllocation | null> {
    const record = await this.db.inventoryAllocation.findFirst({
      where: { id, storeId },
    });

    return record ? toInventoryAllocation(record) : null;
  }

  async listByPickListItemId(
    storeId: string,
    pickListItemId: string,
  ): Promise<readonly InventoryAllocation[]> {
    const records = await this.db.inventoryAllocation.findMany({
      where: { storeId, pickListItemId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return records.map(toInventoryAllocation);
  }

  async listByInventoryItemId(
    storeId: string,
    inventoryItemId: string,
  ): Promise<readonly InventoryAllocation[]> {
    const records = await this.db.inventoryAllocation.findMany({
      where: { storeId, inventoryItemId },
    });

    return records.map(toInventoryAllocation);
  }

  async listByStoreId(storeId: string): Promise<readonly InventoryAllocation[]> {
    const records = await this.db.inventoryAllocation.findMany({
      where: { storeId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return records.map(toInventoryAllocation);
  }

  async create(record: CreateInventoryAllocationRecord): Promise<InventoryAllocation> {
    const created = await this.db.inventoryAllocation.create({
      data: {
        storeId: record.storeId,
        warehouseId: record.warehouseId,
        pickListItemId: record.pickListItemId,
        inventoryItemId: record.inventoryItemId,
        quantityAllocated: record.quantityAllocated,
        quantityPicked: 0,
        status: "allocated",
      },
    });

    return toInventoryAllocation(created);
  }

  async updatePickedQuantity(
    storeId: string,
    id: string,
    update: UpdateInventoryAllocationPickedRecord,
  ): Promise<InventoryAllocation> {
    const updated = await this.db.inventoryAllocation.update({
      where: { id, storeId },
      data: {
        quantityPicked: update.quantityPicked,
        status: update.status,
      },
    });

    return toInventoryAllocation(updated);
  }

  async reportShortage(
    storeId: string,
    id: string,
    update: ReportInventoryAllocationShortageRecord,
  ): Promise<InventoryAllocation> {
    const updated = await this.db.inventoryAllocation.update({
      where: { id, storeId },
      data: {
        status: "shortage",
        shortageReason: update.shortageReason,
      },
    });

    return toInventoryAllocation(updated);
  }

  async markFulfilled(
    storeId: string,
    id: string,
  ): Promise<InventoryAllocation> {
    const updated = await this.db.inventoryAllocation.update({
      where: { id, storeId },
      data: { status: "fulfilled" },
    });

    return toInventoryAllocation(updated);
  }
}
