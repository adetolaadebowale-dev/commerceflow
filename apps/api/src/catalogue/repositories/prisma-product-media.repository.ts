import {
  type PrismaClient,
  type ProductMedia as PrismaProductMedia,
} from "@prisma/client";

import type {
  CreateProductMediaRecordInput,
  ProductMediaRecord,
  ProductMediaRepository,
} from "./product-media.repository";

function toRecord(record: PrismaProductMedia): ProductMediaRecord {
  return {
    id: record.id,
    storeId: record.storeId,
    productId: record.productId,
    storageKey: record.storageKey,
    originalFilename: record.originalFilename,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    width: record.width,
    height: record.height,
    altText: record.altText,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaProductMediaRepository implements ProductMediaRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductMediaRecord | null> {
    const record = await this.db.productMedia.findFirst({
      where: { id, storeId, productId },
    });
    return record ? toRecord(record) : null;
  }

  async listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductMediaRecord[]> {
    const records = await this.db.productMedia.findMany({
      where: { storeId, productId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return records.map(toRecord);
  }

  async countByProductId(storeId: string, productId: string): Promise<number> {
    return this.db.productMedia.count({ where: { storeId, productId } });
  }

  async create(
    input: CreateProductMediaRecordInput,
  ): Promise<ProductMediaRecord> {
    const record = await this.db.productMedia.create({
      data: {
        storeId: input.storeId,
        productId: input.productId,
        storageKey: input.storageKey,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        altText: input.altText ?? null,
        sortOrder: input.sortOrder,
      },
    });
    return toRecord(record);
  }

  async delete(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductMediaRecord> {
    const existing = await this.findById(storeId, productId, id);
    if (!existing) {
      throw new Error(`ProductMedia not found: ${id}`);
    }

    const record = await this.db.productMedia.delete({ where: { id } });
    return toRecord(record);
  }

  async reorder(
    storeId: string,
    productId: string,
    orderedMediaIds: readonly string[],
  ): Promise<readonly ProductMediaRecord[]> {
    const existing = await this.listByProductId(storeId, productId);
    const existingIds = new Set(existing.map((item) => item.id));

    if (orderedMediaIds.length !== existing.length) {
      throw new Error("Reorder payload must include every media id exactly once");
    }

    for (const id of orderedMediaIds) {
      if (!existingIds.has(id)) {
        throw new Error(`Unknown media id in reorder payload: ${id}`);
      }
    }

    if (new Set(orderedMediaIds).size !== orderedMediaIds.length) {
      throw new Error("Reorder payload must not contain duplicate media ids");
    }

    await this.db.$transaction(
      orderedMediaIds.map((id, index) =>
        this.db.productMedia.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.listByProductId(storeId, productId);
  }
}
