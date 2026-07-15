import type { PickList, PickListItem } from "@commerceflow/types";
import type { UpdatePickListInput } from "@commerceflow/validation";

import type {
  CreatePickListRecord,
  PickListStatusTransitionInput,
} from "./pick-list-create-record";
import type { PickListRepository } from "./pick-list.repository";
import { PickListStatusTransitionPolicy } from "../policies/pick-list-status-transition.policy";

export class MemoryPickListRepository implements PickListRepository {
  private readonly pickListsById = new Map<string, PickList>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<PickList | null> {
    const pickList = this.pickListsById.get(id);

    if (!pickList || pickList.storeId !== storeId) {
      return null;
    }

    return pickList;
  }

  async findActiveByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<PickList | null> {
    return (
      [...this.pickListsById.values()].find(
        (pickList) =>
          pickList.storeId === storeId &&
          pickList.shipmentId === shipmentId &&
          PickListStatusTransitionPolicy.isActive(pickList.status),
      ) ?? null
    );
  }

  async listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly PickList[]> {
    return [...this.pickListsById.values()]
      .filter(
        (pickList) =>
          pickList.storeId === storeId && pickList.shipmentId === shipmentId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async create(record: CreatePickListRecord): Promise<PickList> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const pickListId = crypto.randomUUID();
    const items: PickListItem[] = record.items.map((item) => ({
      id: crypto.randomUUID(),
      pickListId,
      orderItemId: item.orderItemId,
      quantityRequired: item.quantityRequired,
      quantityPicked: 0,
      createdAt: now,
      updatedAt: now,
    }));

    const pickList: PickList = {
      id: pickListId,
      storeId: record.storeId,
      shipmentId: record.shipmentId,
      status: "pending",
      assignedToUserId: record.assignedToUserId,
      items,
      createdAt: now,
      updatedAt: now,
    };

    this.pickListsById.set(pickList.id, pickList);
    return pickList;
  }

  async updateItems(
    storeId: string,
    id: string,
    input: UpdatePickListInput,
  ): Promise<PickList> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`PickList not found: ${id}`);
    }

    const now = new Date().toISOString();
    let items = existing.items;

    if (input.items) {
      items = existing.items.map((item) => {
        const update = input.items?.find(
          (entry) => entry.orderItemId === item.orderItemId,
        );

        if (!update) {
          return item;
        }

        return {
          ...item,
          quantityPicked: update.quantityPicked,
          updatedAt: now,
        };
      });

      for (const itemUpdate of input.items) {
        if (!items.some((item) => item.orderItemId === itemUpdate.orderItemId)) {
          throw new Error(
            `PickListItem not found for order item: ${itemUpdate.orderItemId}`,
          );
        }
      }
    }

    const updated: PickList = {
      ...existing,
      assignedToUserId: input.assignedToUserId ?? existing.assignedToUserId,
      items,
      updatedAt: now,
    };

    this.pickListsById.set(id, updated);
    return updated;
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: PickListStatusTransitionInput,
  ): Promise<PickList> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`PickList not found: ${id}`);
    }

    const updated: PickList = {
      ...existing,
      status: transition.status,
      startedAt: transition.startedAt?.toISOString() ?? existing.startedAt,
      completedAt:
        transition.completedAt?.toISOString() ?? existing.completedAt,
      updatedAt: new Date().toISOString(),
    };

    this.pickListsById.set(id, updated);
    return updated;
  }
}
