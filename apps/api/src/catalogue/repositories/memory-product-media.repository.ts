import type {
  CreateProductMediaRecordInput,
  ProductMediaRecord,
  ProductMediaRepository,
} from "./product-media.repository";

export class MemoryProductMediaRepository implements ProductMediaRepository {
  private readonly mediaById = new Map<string, ProductMediaRecord>();

  async findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductMediaRecord | null> {
    const media = this.mediaById.get(id);
    if (!media || media.storeId !== storeId || media.productId !== productId) {
      return null;
    }
    return media;
  }

  async listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductMediaRecord[]> {
    return [...this.mediaById.values()]
      .filter(
        (media) => media.storeId === storeId && media.productId === productId,
      )
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }
        return left.createdAt.localeCompare(right.createdAt);
      });
  }

  async countByProductId(storeId: string, productId: string): Promise<number> {
    const items = await this.listByProductId(storeId, productId);
    return items.length;
  }

  async create(
    input: CreateProductMediaRecordInput,
  ): Promise<ProductMediaRecord> {
    const now = new Date().toISOString();
    const media: ProductMediaRecord = {
      id: crypto.randomUUID(),
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
      createdAt: now,
      updatedAt: now,
    };
    this.mediaById.set(media.id, media);
    return media;
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
    this.mediaById.delete(id);
    return existing;
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

    const now = new Date().toISOString();
    orderedMediaIds.forEach((id, index) => {
      const media = this.mediaById.get(id);
      if (!media) {
        return;
      }
      this.mediaById.set(id, {
        ...media,
        sortOrder: index,
        updatedAt: now,
      });
    });

    return this.listByProductId(storeId, productId);
  }

  getAll(): readonly ProductMediaRecord[] {
    return [...this.mediaById.values()];
  }
}
