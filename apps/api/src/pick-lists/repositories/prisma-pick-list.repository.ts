import {
  type PickListItem as PrismaPickListItem,
  type PickList as PrismaPickList,
  type PrismaClient,
} from "@prisma/client";
import type { PickList, PickListItem } from "@commerceflow/types";
import type { UpdatePickListInput } from "@commerceflow/validation";

import type {
  CreatePickListRecord,
  PickListStatusTransitionInput,
} from "./pick-list-create-record";
import type { PickListRepository } from "./pick-list.repository";

type PickListWithItems = PrismaPickList & {
  items: PrismaPickListItem[];
};

function toPickListItem(record: PrismaPickListItem): PickListItem {
  return {
    id: record.id,
    pickListId: record.pickListId,
    orderItemId: record.orderItemId,
    quantityRequired: record.quantityRequired,
    quantityPicked: record.quantityPicked,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPickList(record: PickListWithItems): PickList {
  return {
    id: record.id,
    storeId: record.storeId,
    shipmentId: record.shipmentId,
    status: record.status,
    assignedToUserId: record.assignedToUserId ?? undefined,
    startedAt: record.startedAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    items: record.items.map(toPickListItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaPickListRepository implements PickListRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<PickList | null> {
    const record = await this.db.pickList.findFirst({
      where: { id, storeId },
      include: {
        items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });

    return record ? toPickList(record) : null;
  }

  async findItemById(
    storeId: string,
    pickListItemId: string,
  ): Promise<import("./pick-list.repository").PickListItemContext | null> {
    const record = await this.db.pickListItem.findFirst({
      where: { id: pickListItemId, pickList: { storeId } },
      include: {
        pickList: {
          include: {
            items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      item: toPickListItem(record),
      pickList: toPickList(record.pickList),
    };
  }

  async findActiveByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<PickList | null> {
    const record = await this.db.pickList.findFirst({
      where: {
        storeId,
        shipmentId,
        status: { not: "packed" },
      },
      include: {
        items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });

    return record ? toPickList(record) : null;
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly PickList[]> {
    const records = await this.db.pickList.findMany({
      where: { storeId, shipmentId },
      include: {
        items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return records.map(toPickList);
  }

  async create(record: CreatePickListRecord): Promise<PickList> {
    const created = await this.db.pickList.create({
      data: {
        storeId: record.storeId,
        shipmentId: record.shipmentId,
        assignedToUserId: record.assignedToUserId,
        items: {
          create: record.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantityRequired: item.quantityRequired,
            quantityPicked: 0,
          })),
        },
      },
      include: {
        items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });

    return toPickList(created);
  }

  async updateItems(
    storeId: string,
    id: string,
    input: UpdatePickListInput,
  ): Promise<PickList> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`PickList not found: ${id}`);
    }

    await this.db.$transaction(async (tx) => {
      if (input.assignedToUserId !== undefined) {
        await tx.pickList.update({
          where: { id, storeId },
          data: { assignedToUserId: input.assignedToUserId },
        });
      }

      if (input.items) {
        for (const itemUpdate of input.items) {
          const item = existing.items.find(
            (entry) => entry.orderItemId === itemUpdate.orderItemId,
          );

          if (!item) {
            throw new Error(
              `PickListItem not found for order item: ${itemUpdate.orderItemId}`,
            );
          }

          await tx.pickListItem.update({
            where: { id: item.id },
            data: { quantityPicked: itemUpdate.quantityPicked },
          });
        }
      }
    });

    const updated = await this.findById(storeId, id);

    if (!updated) {
      throw new Error(`PickList not found: ${id}`);
    }

    return updated;
  }

  async syncItemQuantityPicked(
    storeId: string,
    pickListItemId: string,
    quantityPicked: number,
  ): Promise<void> {
    const item = await this.db.pickListItem.findFirst({
      where: { id: pickListItemId, pickList: { storeId } },
    });

    if (!item) {
      throw new Error(`PickListItem not found: ${pickListItemId}`);
    }

    await this.db.pickListItem.update({
      where: { id: pickListItemId },
      data: { quantityPicked },
    });
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: PickListStatusTransitionInput,
  ): Promise<PickList> {
    const updated = await this.db.pickList.update({
      where: { id, storeId },
      data: {
        status: transition.status,
        startedAt: transition.startedAt,
        completedAt: transition.completedAt,
      },
      include: {
        items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });

    return toPickList(updated);
  }
}
