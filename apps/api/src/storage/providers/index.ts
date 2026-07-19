import { LocalStorageProvider } from "./local-storage.provider";
import { MemoryStorageProvider } from "./memory-storage.provider";
import type { StorageProvider } from "./storage-provider";

export type StorageProviderKind = "local" | "memory";

let singleton: StorageProvider | null = null;

export function createStorageProvider(
  kind: StorageProviderKind = "local",
): StorageProvider {
  if (kind === "memory") {
    return new MemoryStorageProvider();
  }

  return new LocalStorageProvider();
}

export function getStorageProvider(): StorageProvider {
  if (!singleton) {
    const kind =
      process.env.MEDIA_STORAGE_PROVIDER?.trim().toLowerCase() === "memory"
        ? "memory"
        : "local";
    singleton = createStorageProvider(kind);
  }

  return singleton;
}

/** Test helper to replace the process-wide provider. */
export function setStorageProviderForTests(provider: StorageProvider | null): void {
  singleton = provider;
}

export type { StorageProvider, StorageUploadInput, StorageUploadResult } from "./storage-provider";
export { LocalStorageProvider } from "./local-storage.provider";
export { MemoryStorageProvider } from "./memory-storage.provider";
