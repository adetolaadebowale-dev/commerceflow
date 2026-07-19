import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage-provider";

/** In-memory storage for unit tests. */
export class MemoryStorageProvider implements StorageProvider {
  private readonly objects = new Map<
    string,
    { readonly body: Uint8Array; readonly contentType: string }
  >();

  constructor(private readonly publicBaseUrl = "http://localhost/media") {}

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const body =
      input.body instanceof Buffer
        ? new Uint8Array(input.body)
        : new Uint8Array(input.body);
    this.objects.set(input.key, {
      body,
      contentType: input.contentType,
    });
    return { key: input.key };
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }

  getObjectCount(): number {
    return this.objects.size;
  }
}
