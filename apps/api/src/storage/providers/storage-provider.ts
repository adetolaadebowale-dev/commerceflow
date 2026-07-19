/**
 * Abstraction over binary object storage for product media and future assets.
 * Implementations must not couple callers to a specific cloud or filesystem layout.
 */
export interface StorageUploadInput {
  readonly key: string;
  readonly body: Buffer | Uint8Array;
  readonly contentType: string;
  readonly originalFilename?: string;
}

export interface StorageUploadResult {
  readonly key: string;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
