import type { ProductMedia, ProductMediaListResponse } from "@commerceflow/types";
import {
  assertProductMediaFileConstraints,
  productMediaUploadMetaSchema,
  reorderProductMediaSchema,
  type ProductMediaUploadMeta,
  type ReorderProductMediaInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getStorageProvider,
  type StorageProvider,
} from "@/storage";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import {
  getProductMediaRepository,
  getProductRepository,
  type ProductMediaRecord,
  type ProductMediaRepository,
  type ProductRepository,
} from "../repositories";

export interface ProductMediaUploadFile {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly originalFilename: string;
  readonly sizeBytes: number;
}

export interface ProductMediaServiceDependencies {
  readonly productRepository?: ProductRepository;
  readonly productMediaRepository?: ProductMediaRepository;
  readonly storageProvider?: StorageProvider;
  readonly domainEventPublisher?: DomainEventPublisher;
}

function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop()?.trim() || "upload";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "upload";
}

function toValidationError(error: unknown): CatalogueError | null {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof (error as { flatten: unknown }).flatten === "function"
  ) {
    return new CatalogueError(
      CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      (error as { flatten: () => unknown }).flatten(),
    );
  }
  return null;
}

export class ProductMediaService {
  private readonly productRepository: ProductRepository;
  private readonly productMediaRepository: ProductMediaRepository;
  private readonly storageProvider: StorageProvider;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ProductMediaServiceDependencies = {}) {
    this.productRepository =
      dependencies.productRepository ?? getProductRepository();
    this.productMediaRepository =
      dependencies.productMediaRepository ?? getProductMediaRepository();
    this.storageProvider =
      dependencies.storageProvider ?? getStorageProvider();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async listProductMedia(
    storeId: string,
    productId: string,
  ): Promise<ProductMediaListResponse> {
    await this.ensureProductExists(storeId, productId);
    const records = await this.productMediaRepository.listByProductId(
      storeId,
      productId,
    );
    return { items: records.map((record) => this.toProductMedia(record)) };
  }

  async uploadProductMedia(
    storeId: string,
    productId: string,
    file: ProductMediaUploadFile,
    meta: ProductMediaUploadMeta = {},
  ): Promise<ProductMedia> {
    await this.ensureProductExists(storeId, productId);

    let parsedMeta: ProductMediaUploadMeta;
    try {
      parsedMeta = productMediaUploadMetaSchema.parse(meta);
      assertProductMediaFileConstraints({
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      });
    } catch (error) {
      const validationError = toValidationError(error);
      if (validationError) {
        throw validationError;
      }
      throw error;
    }

    const count = await this.productMediaRepository.countByProductId(
      storeId,
      productId,
    );
    const safeName = sanitizeFilename(file.originalFilename);
    const storageKey = `stores/${storeId}/products/${productId}/${crypto.randomUUID()}-${safeName}`;

    await this.storageProvider.upload({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimeType,
      originalFilename: file.originalFilename,
    });

    try {
      const record = await this.productMediaRepository.create({
        storeId,
        productId,
        storageKey,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        width: null,
        height: null,
        altText: parsedMeta.altText ?? null,
        sortOrder: count,
      });
      const media = this.toProductMedia(record);
      this.domainEventPublisher.publishProductMediaUploaded(media);
      return media;
    } catch (error) {
      await this.storageProvider.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async deleteProductMedia(
    storeId: string,
    productId: string,
    mediaId: string,
  ): Promise<ProductMedia> {
    await this.ensureProductExists(storeId, productId);

    const existing = await this.productMediaRepository.findById(
      storeId,
      productId,
      mediaId,
    );
    if (!existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.PRODUCT_MEDIA_NOT_FOUND,
        "Product media not found",
        404,
      );
    }

    const deleted = await this.productMediaRepository.delete(
      storeId,
      productId,
      mediaId,
    );
    await this.storageProvider.delete(deleted.storageKey).catch(() => undefined);

    const media = this.toProductMedia(deleted);
    this.domainEventPublisher.publishProductMediaDeleted(media);
    return media;
  }

  async reorderProductMedia(
    storeId: string,
    productId: string,
    input: ReorderProductMediaInput,
  ): Promise<ProductMediaListResponse> {
    await this.ensureProductExists(storeId, productId);

    let parsed: ReorderProductMediaInput;
    try {
      parsed = reorderProductMediaSchema.parse(input);
    } catch (error) {
      const validationError = toValidationError(error);
      if (validationError) {
        throw validationError;
      }
      throw error;
    }

    try {
      const records = await this.productMediaRepository.reorder(
        storeId,
        productId,
        parsed.orderedMediaIds,
      );
      const items = records.map((record) => this.toProductMedia(record));
      this.domainEventPublisher.publishProductMediaReordered(
        storeId,
        productId,
        items,
      );
      return { items };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Reorder")) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.PRODUCT_MEDIA_REORDER_MISMATCH,
          error.message,
          400,
        );
      }
      throw error;
    }
  }

  private async ensureProductExists(
    storeId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.productRepository.findById(storeId, productId);
    if (!product) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Product not found",
        404,
      );
    }
  }

  private toProductMedia(record: ProductMediaRecord): ProductMedia {
    return {
      ...record,
      url: this.storageProvider.getPublicUrl(record.storageKey),
    };
  }
}

export const productMediaService = new ProductMediaService();
