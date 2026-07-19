/**
 * Product media asset metadata. Binary content lives in object storage,
 * referenced by storageKey; url is a derived public locator.
 */
export interface ProductMedia {
  readonly id: string;
  readonly storeId: string;
  readonly productId: string;
  readonly storageKey: string;
  readonly url: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Multipart metadata fields for product media upload (file is separate). */
export interface CreateProductMediaRequest {
  readonly altText?: string;
}

/** List payload for product media. */
export interface ProductMediaListResponse {
  readonly items: readonly ProductMedia[];
}

/** Reorder product media by ordered media ids. */
export interface ReorderProductMediaRequest {
  readonly orderedMediaIds: readonly string[];
}
