import {
  buildCatalogueListResult,
  type InventoryItem,
  type StockMovement,
  type CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  ListInventoryItemsQuery,
} from "@commerceflow/validation";

import type { InventoryAdjustmentResult } from "./inventory-adjustment-result";
import type { InventoryItemRepository } from "./inventory-item.repository";

export class MemoryInventoryItemRepository implements InventoryItemRepository {
  private readonly itemsById = new Map<string, InventoryItem>();
  private readonly deletedIds = new Set<string>();
  private readonly variantsByStore = new Map<string, Set<string>>();
  private transactionFailure: Error | null = null;

  seedProductVariant(storeId: string, productVariantId: string): void {
    const variants = this.variantsByStore.get(storeId) ?? new Set<string>();
    variants.add(productVariantId);
    this.variantsByStore.set(storeId, variants);
  }

  /** Simulates a mid-transaction failure for rollback tests. */
  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  /** Marks an inventory item as soft-deleted for test scenarios. */
  softDelete(id: string): void {
    this.deletedIds.add(id);
  }

  getItemCount(): number {
    return this.itemsById.size;
  }

  getAllMovements(): readonly StockMovement[] {
    return [...this.movementsById.values()];
  }

  private readonly movementsById = new Map<string, StockMovement>();

  async findById(storeId: string, id: string): Promise<InventoryItem | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const item = this.itemsById.get(id);
    return item?.storeId === storeId ? item : null;
  }

  async findByProductVariantId(
    storeId: string,
    productVariantId: string,
  ): Promise<InventoryItem | null> {
    for (const item of this.itemsById.values()) {
      if (
        item.storeId === storeId &&
        item.productVariantId === productVariantId &&
        !this.deletedIds.has(item.id)
      ) {
        return item;
      }
    }

    return null;
  }

  async list(
    query: ListInventoryItemsQuery,
  ): Promise<CatalogueListResult<InventoryItem>> {
    let items = [...this.itemsById.values()].filter(
      (item) =>
        item.storeId === query.storeId && !this.deletedIds.has(item.id),
    );

    if (query.productVariantId) {
      items = items.filter(
        (item) => item.productVariantId === query.productVariantId,
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createWithInitialMovement(
    input: CreateInventoryItemInput,
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.findByProductVariantId(
      input.storeId,
      input.productVariantId,
    );

    if (existing) {
      throw new Error("Unique constraint failed on store_id, product_variant_id");
    }

    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      productVariantId: input.productVariantId,
      quantityOnHand: input.initialQuantity,
      createdAt: now,
      updatedAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);

    if (this.transactionFailure) {
      this.itemsById.delete(inventoryItem.id);
      throw this.transactionFailure;
    }

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      inventoryItemId: inventoryItem.id,
      productVariantId: input.productVariantId,
      quantityChange: input.initialQuantity,
      quantityAfter: input.initialQuantity,
      reason: "initial",
      createdAt: now,
    };

    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }

  async adjustStock(
    input: CreateStockMovementInput,
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.findById(input.storeId, input.inventoryItemId);

    if (!existing) {
      throw new Error(`InventoryItem not found: ${input.inventoryItemId}`);
    }

    const quantityAfter = existing.quantityOnHand + input.quantityChange;

    if (quantityAfter < 0) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: quantityAfter,
      updatedAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);

    if (this.transactionFailure) {
      this.itemsById.set(existing.id, existing);
      throw this.transactionFailure;
    }

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      inventoryItemId: inventoryItem.id,
      productVariantId: inventoryItem.productVariantId,
      quantityChange: input.quantityChange,
      quantityAfter,
      reason: input.reason,
      createdAt: now,
    };

    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }

  async productVariantExists(
    storeId: string,
    productVariantId: string,
  ): Promise<boolean> {
    return this.variantsByStore.get(storeId)?.has(productVariantId) ?? false;
  }

  async deductForFulfillment(
    storeId: string,
    inventoryItemId: string,
    quantity: number,
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.findById(storeId, inventoryItemId);

    if (!existing) {
      throw new Error(`InventoryItem not found: ${inventoryItemId}`);
    }

    if (existing.quantityOnHand < quantity) {
      throw new Error("INSUFFICIENT_RESERVED_STOCK");
    }

    const quantityAfter = existing.quantityOnHand - quantity;
    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: quantityAfter,
      updatedAt: now,
    };

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId,
      inventoryItemId: inventoryItem.id,
      productVariantId: inventoryItem.productVariantId,
      quantityChange: -quantity,
      quantityAfter,
      reason: "sale_fulfilled",
      createdAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);
    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }
}
