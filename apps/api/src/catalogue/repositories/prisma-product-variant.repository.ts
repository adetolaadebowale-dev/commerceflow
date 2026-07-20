import {
  Prisma,
  type PrismaClient,
  type ProductVariant as PrismaProductVariant,
} from "@prisma/client";
import type { UpdateProductVariantInput } from "@commerceflow/validation";

import type {
  CreateProductVariantRecordInput,
  ProductVariantRecord,
  ProductVariantRepository,
} from "./product-variant.repository";

function toRecord(record: PrismaProductVariant): ProductVariantRecord {
  return {
    id: record.id,
    storeId: record.storeId,
    productId: record.productId,
    sku: record.sku,
    name: record.name,
    price: record.price.toString(),
    currency: record.currency,
    attributes:
      record.attributes && typeof record.attributes === "object"
        ? (record.attributes as Record<string, string>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
  };
}

export class PrismaProductVariantRepository
  implements ProductVariantRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductVariantRecord | null> {
    const record = await this.db.productVariant.findFirst({
      where: { id, storeId, productId, deletedAt: null },
    });
    return record ? toRecord(record) : null;
  }

  async listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductVariantRecord[]> {
    const records = await this.db.productVariant.findMany({
      where: { storeId, productId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return records.map(toRecord);
  }

  async countByProductId(storeId: string, productId: string): Promise<number> {
    return this.db.productVariant.count({
      where: { storeId, productId, deletedAt: null },
    });
  }

  async create(
    input: CreateProductVariantRecordInput,
  ): Promise<ProductVariantRecord> {
    const record = await this.db.productVariant.create({
      data: {
        storeId: input.storeId,
        productId: input.productId,
        sku: input.sku.trim(),
        name: input.name.trim(),
        price: input.price,
        currency: input.currency,
        attributes: input.attributes as Prisma.InputJsonValue,
      },
    });
    return toRecord(record);
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

    const record = await this.db.productVariant.update({
      where: { id },
      data: {
        ...(input.sku !== undefined ? { sku: input.sku.trim() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.attributes !== undefined
          ? { attributes: input.attributes as Prisma.InputJsonValue }
          : {}),
      },
    });
    return toRecord(record);
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

    const record = await this.db.productVariant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return toRecord(record);
  }
}
