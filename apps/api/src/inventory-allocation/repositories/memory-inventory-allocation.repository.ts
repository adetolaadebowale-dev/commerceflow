import type { InventoryAllocation } from "@commerceflow/types";

import { InventoryAllocationStatusPolicy } from "../policies/inventory-allocation-status.policy";
import type { CreateInventoryAllocationRecord } from "./inventory-allocation-create-record";
import type {
  ReportInventoryAllocationShortageRecord,
  UpdateInventoryAllocationPickedRecord,
} from "./inventory-allocation-create-record";
import type { InventoryAllocationRepository } from "./inventory-allocation.repository";

export class MemoryInventoryAllocationRepository
  implements InventoryAllocationRepository
{
  private readonly allocationsById = new Map<string, InventoryAllocation>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<InventoryAllocation | null> {
    const allocation = this.allocationsById.get(id);

    if (!allocation || allocation.storeId !== storeId) {
      return null;
    }

    return allocation;
  }

  async listByPickListItemId(
    storeId: string,
    pickListItemId: string,
  ): Promise<readonly InventoryAllocation[]> {
    return [...this.allocationsById.values()]
      .filter(
        (allocation) =>
          allocation.storeId === storeId &&
          allocation.pickListItemId === pickListItemId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async listByInventoryItemId(
    storeId: string,
    inventoryItemId: string,
  ): Promise<readonly InventoryAllocation[]> {
    return [...this.allocationsById.values()].filter(
      (allocation) =>
        allocation.storeId === storeId &&
        allocation.inventoryItemId === inventoryItemId,
    );
  }

  async create(record: CreateInventoryAllocationRecord): Promise<InventoryAllocation> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const allocation: InventoryAllocation = {
      id: crypto.randomUUID(),
      storeId: record.storeId,
      warehouseId: record.warehouseId,
      pickListItemId: record.pickListItemId,
      inventoryItemId: record.inventoryItemId,
      quantityAllocated: record.quantityAllocated,
      quantityPicked: 0,
      status: "allocated",
      createdAt: now,
      updatedAt: now,
    };

    this.allocationsById.set(allocation.id, allocation);
    return allocation;
  }

  async updatePickedQuantity(
    storeId: string,
    id: string,
    update: UpdateInventoryAllocationPickedRecord,
  ): Promise<InventoryAllocation> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`InventoryAllocation not found: ${id}`);
    }

    const updated: InventoryAllocation = {
      ...existing,
      quantityPicked: update.quantityPicked,
      status: update.status,
      updatedAt: new Date().toISOString(),
    };

    this.allocationsById.set(id, updated);
    return updated;
  }

  async reportShortage(
    storeId: string,
    id: string,
    update: ReportInventoryAllocationShortageRecord,
  ): Promise<InventoryAllocation> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`InventoryAllocation not found: ${id}`);
    }

    const updated: InventoryAllocation = {
      ...existing,
      status: "shortage",
      shortageReason: update.shortageReason,
      updatedAt: new Date().toISOString(),
    };

    this.allocationsById.set(id, updated);
    return updated;
  }

  async markFulfilled(
    storeId: string,
    id: string,
  ): Promise<InventoryAllocation> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`InventoryAllocation not found: ${id}`);
    }

    const updated: InventoryAllocation = {
      ...existing,
      status: "fulfilled",
      updatedAt: new Date().toISOString(),
    };

    this.allocationsById.set(id, updated);
    return updated;
  }

  /** Exposed for tests to inspect derived status without persisting. */
  deriveStatus(quantityAllocated: number, quantityPicked: number) {
    return InventoryAllocationStatusPolicy.deriveStatus(
      quantityAllocated,
      quantityPicked,
    );
  }
}
