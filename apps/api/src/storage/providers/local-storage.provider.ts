import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage-provider";

function resolveStorageRoot(): string {
  const configured = process.env.MEDIA_STORAGE_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), "..", "..", ".tmp", "media");
}

function resolvePublicBaseUrl(): string {
  const configured = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const appUrl = process.env.PUBLIC_API_URL?.trim() || process.env.APP_URL?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/media`;
  }

  return "http://localhost:3000/media";
}

/**
 * Local filesystem storage for development. Files live outside the repo by default
 * (MEDIA_STORAGE_PATH or ../../.tmp/media relative to apps/api).
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(options?: {
    readonly rootDir?: string;
    readonly publicBaseUrl?: string;
  }) {
    this.rootDir = options?.rootDir ?? resolveStorageRoot();
    this.publicBaseUrl = options?.publicBaseUrl ?? resolvePublicBaseUrl();
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const absolutePath = this.resolveKeyPath(input.key);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.body);
    return { key: input.key };
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolveKeyPath(key);
    try {
      await unlink(absolutePath);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    const encoded = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${this.publicBaseUrl}/${encoded}`;
  }

  private resolveKeyPath(key: string): string {
    const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
    if (
      normalized.includes("..") ||
      path.isAbsolute(normalized) ||
      normalized.length === 0
    ) {
      throw new Error(`Invalid storage key: ${key}`);
    }

    const absolutePath = path.resolve(this.rootDir, ...normalized.split("/"));
    if (!absolutePath.startsWith(path.resolve(this.rootDir))) {
      throw new Error(`Invalid storage key: ${key}`);
    }

    return absolutePath;
  }
}
