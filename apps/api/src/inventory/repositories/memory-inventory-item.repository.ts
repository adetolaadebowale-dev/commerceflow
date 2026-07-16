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

  /** Test helper: insert a fully-formed inventory item record. */
  seedInventoryItem(item: InventoryItem): void {
    this.itemsById.set(item.id, item);
    this.seedProductVariant(item.storeId, item.productVariantId);
  }

  /** Test helper: insert a stock movement ledger entry. */
  seedStockMovement(movement: StockMovement): void {
    this.movementsById.set(movement.id, movement);
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
    warehouseId: string,
    productVariantId: string,
  ): Promise<InventoryItem | null> {
    for (const item of this.itemsById.values()) {
      if (
        item.storeId === storeId &&
        item.warehouseId === warehouseId &&
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

    if (query.warehouseId) {
      items = items.filter((item) => item.warehouseId === query.warehouseId);
    }

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
      input.warehouseId,
      input.productVariantId,
    );

    if (existing) {
      throw new Error("Unique constraint failed on store_id, product_variant_id");
    }

    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      warehouseId: input.warehouseId,
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
      warehouseId: input.warehouseId,
      inventoryItemId: inventoryItem.id,
      movementType: "adjustment",
      quantity: input.initialQuantity,
      previousQuantityOnHand: 0,
      newQuantityOnHand: input.initialQuantity,
      reference: "initial",
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

    const newQuantityOnHand = existing.quantityOnHand + input.quantityChange;

    if (newQuantityOnHand < 0) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: newQuantityOnHand,
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
      warehouseId: existing.warehouseId,
      inventoryItemId: inventoryItem.id,
      movementType: "adjustment",
      quantity: input.quantityChange,
      previousQuantityOnHand: existing.quantityOnHand,
      newQuantityOnHand,
      reference: input.reason,
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

    const newQuantityOnHand = existing.quantityOnHand - quantity;
    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: newQuantityOnHand,
      updatedAt: now,
    };

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId,
      warehouseId: existing.warehouseId,
      inventoryItemId: inventoryItem.id,
      movementType: "fulfillment",
      quantity: -quantity,
      previousQuantityOnHand: existing.quantityOnHand,
      newQuantityOnHand,
      createdAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);
    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }

  async deductForShipmentFulfillment(
    storeId: string,
    inventoryItemId: string,
    quantity: number,
    context: {
      shipmentId: string;
      inventoryAllocationId: string;
      reference: string;
    },
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.findById(storeId, inventoryItemId);

    if (!existing) {
      throw new Error(`InventoryItem not found: ${inventoryItemId}`);
    }

    if (existing.quantityOnHand < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const newQuantityOnHand = existing.quantityOnHand - quantity;
    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: newQuantityOnHand,
      updatedAt: now,
    };

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId,
      warehouseId: existing.warehouseId,
      inventoryItemId: inventoryItem.id,
      shipmentId: context.shipmentId,
      inventoryAllocationId: context.inventoryAllocationId,
      movementType: "fulfillment",
      quantity: -quantity,
      previousQuantityOnHand: existing.quantityOnHand,
      newQuantityOnHand,
      reference: context.reference,
      createdAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);
    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }

  async restockForReturn(
    storeId: string,
    inventoryItemId: string,
    quantity: number,
    context: {
      returnId: string;
      returnItemId: string;
      reference: string;
    },
  ): Promise<InventoryAdjustmentResult> {
    const existing = await this.findById(storeId, inventoryItemId);

    if (!existing) {
      throw new Error(`InventoryItem not found: ${inventoryItemId}`);
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const newQuantityOnHand = existing.quantityOnHand + quantity;
    const now = new Date().toISOString();
    const inventoryItem: InventoryItem = {
      ...existing,
      quantityOnHand: newQuantityOnHand,
      updatedAt: now,
    };

    const stockMovement: StockMovement = {
      id: crypto.randomUUID(),
      storeId,
      warehouseId: existing.warehouseId,
      inventoryItemId: inventoryItem.id,
      movementType: "return",
      quantity,
      previousQuantityOnHand: existing.quantityOnHand,
      newQuantityOnHand,
      reference: context.reference,
      metadata: {
        returnId: context.returnId,
        returnItemId: context.returnItemId,
      },
      createdAt: now,
    };

    this.itemsById.set(inventoryItem.id, inventoryItem);
    this.movementsById.set(stockMovement.id, stockMovement);

    return { inventoryItem, stockMovement };
  }
}
