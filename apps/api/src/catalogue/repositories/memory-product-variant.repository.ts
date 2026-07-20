import type { UpdateProductVariantInput } from "@commerceflow/validation";

import type {
  CreateProductVariantRecordInput,
  ProductVariantRecord,
  ProductVariantRepository,
} from "./product-variant.repository";

export class MemoryProductVariantRepository
  implements ProductVariantRepository
{
  private readonly variantsById = new Map<string, ProductVariantRecord>();

  async findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductVariantRecord | null> {
    const variant = this.variantsById.get(id);
    if (
      !variant ||
      variant.storeId !== storeId ||
      variant.productId !== productId ||
      variant.deletedAt !== null
    ) {
      return null;
    }
    return variant;
  }

  async listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductVariantRecord[]> {
    return [...this.variantsById.values()]
      .filter(
        (variant) =>
          variant.storeId === storeId &&
          variant.productId === productId &&
          variant.deletedAt === null,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async countByProductId(storeId: string, productId: string): Promise<number> {
    const items = await this.listByProductId(storeId, productId);
    return items.length;
  }

  async create(
    input: CreateProductVariantRecordInput,
  ): Promise<ProductVariantRecord> {
    for (const existing of this.variantsById.values()) {
      if (
        existing.storeId === input.storeId &&
        existing.deletedAt === null &&
        existing.sku === input.sku.trim()
      ) {
        throw new Error("Unique constraint failed on sku");
      }
    }

    const now = new Date().toISOString();
    const variant: ProductVariantRecord = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      productId: input.productId,
      sku: input.sku.trim(),
      name: input.name.trim(),
      price: input.price,
      currency: input.currency,
      attributes: input.attributes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.variantsById.set(variant.id, variant);
    return variant;
  }

  async update(
    storeId: string,
    productId: string,
    id: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariantRecord> {
    const existing = await this.findById(storeId, productId, id);
    if (!existing) {
      throw new Error(`ProductVariant not found: ${id}`);
    }

    if (input.sku !== undefined) {
      const nextSku = input.sku.trim();
      for (const other of this.variantsById.values()) {
        if (
          other.id !== id &&
          other.storeId === storeId &&
          other.deletedAt === null &&
          other.sku === nextSku
        ) {
          throw new Error("Unique constraint failed on sku");
        }
      }
    }

    const updated: ProductVariantRecord = {
      ...existing,
      sku: input.sku !== undefined ? input.sku.trim() : existing.sku,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      price: input.price !== undefined ? input.price : existing.price,
      currency:
        input.currency !== undefined ? input.currency : existing.currency,
      attributes:
        input.attributes !== undefined
          ? input.attributes
          : existing.attributes,
      updatedAt: new Date().toISOString(),
    };
    this.variantsById.set(id, updated);
    return updated;
  }

  async softDelete(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductVariantRecord> {
    const existing = await this.findById(storeId, productId, id);
    if (!existing) {
      throw new Error(`ProductVariant not found: ${id}`);
    }

    const deleted: ProductVariantRecord = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.variantsById.set(id, deleted);
    return deleted;
  }
}
