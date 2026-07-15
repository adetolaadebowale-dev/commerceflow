import type {
  InventoryAdjustment,
  InventoryAdjustmentResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type { ListInventoryAdjustmentsQuery } from "@commerceflow/validation";

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import type {
  CreateInventoryAdjustmentRecord,
  InventoryAdjustmentRepository,
} from "./inventory-adjustment.repository";

export class MemoryInventoryAdjustmentRepository
  implements InventoryAdjustmentRepository
{
  private readonly adjustmentsById = new Map<string, InventoryAdjustment>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
    this.inventoryItemRepository.setTransactionFailure(error);
  }

  async findById(storeId: string, id: string): Promise<InventoryAdjustment | null> {
    const record = this.adjustmentsById.get(id);
    return record?.storeId === storeId ? record : null;
  }

  async list(query: ListInventoryAdjustmentsQuery) {
    const items = [...this.adjustmentsById.values()]
      .filter((record) => {
        if (record.storeId !== query.storeId) {
          return false;
        }

        if (
          query.inventoryItemId &&
          record.inventoryItemId !== query.inventoryItemId
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit),
      total: items.length,
      page: query.page,
      limit: query.limit,
    });
  }

  async createAdjustment(
    record: CreateInventoryAdjustmentRecord,
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.inventoryItemRepository.findById(
      record.storeId,
      record.inventoryItemId,
    );

    if (!existing) {
      throw new Error(`InventoryItem not found: ${record.inventoryItemId}`);
    }

    const { stockMovement } = await this.inventoryItemRepository.adjustStock({
      storeId: record.storeId,
      inventoryItemId: record.inventoryItemId,
      quantityChange: record.movementQuantity,
      reason: "manual_adjustment",
    });

    const now = new Date().toISOString();
    const adjustmentId = crypto.randomUUID();

    const adjustment: InventoryAdjustment = {
      id: adjustmentId,
      storeId: record.storeId,
      warehouseId: existing.warehouseId,
      inventoryItemId: record.inventoryItemId,
      adjustmentNumber: record.adjustmentNumber,
      movementQuantity: record.movementQuantity,
      reason: record.reason,
      notes: record.notes,
      previousQuantityOnHand: stockMovement.previousQuantityOnHand,
      newQuantityOnHand: stockMovement.newQuantityOnHand,
      createdByUserId: record.createdByUserId,
      createdAt: now,
    };

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    this.adjustmentsById.set(adjustmentId, adjustment);

    return {
      adjustment,
      stockMovement: {
        ...stockMovement,
        reference: record.adjustmentNumber,
        metadata: {
          reason: record.reason,
          adjustmentNumber: record.adjustmentNumber,
        },
      },
    };
  }
}
