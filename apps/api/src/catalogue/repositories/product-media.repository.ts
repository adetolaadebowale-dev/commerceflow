import type { ProductMedia } from "@commerceflow/types";

/** Persistence record; `url` is derived by the service via StorageProvider. */
export type ProductMediaRecord = Omit<ProductMedia, "url">;

export interface CreateProductMediaRecordInput {
  readonly storeId: string;
  readonly productId: string;
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly altText?: string | null;
  readonly sortOrder: number;
}

export interface ProductMediaRepository {
  findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductMediaRecord | null>;
  listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductMediaRecord[]>;
  countByProductId(storeId: string, productId: string): Promise<number>;
  create(input: CreateProductMediaRecordInput): Promise<ProductMediaRecord>;
  delete(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductMediaRecord>;
  reorder(
    storeId: string,
    productId: string,
    orderedMediaIds: readonly string[],
  ): Promise<readonly ProductMediaRecord[]>;
}
