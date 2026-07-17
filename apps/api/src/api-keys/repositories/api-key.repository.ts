import type { ApiKey, StorePermissionCode } from "@commerceflow/types";
import type { CreateApiKeyInput, ListApiKeysQuery } from "@commerceflow/validation";

export interface ApiKeyRepository {
  findById(storeId: string, id: string): Promise<ApiKey | null>;
  findByKeyPrefix(keyPrefix: string): Promise<ApiKey | null>;
  findByKeyPrefixWithHash(
    keyPrefix: string,
  ): Promise<(ApiKey & { hashedKey: string }) | null>;
  list(query: ListApiKeysQuery): Promise<{
    items: readonly ApiKey[];
    total: number;
    page: number;
    limit: number;
  }>;
  create(
    input: CreateApiKeyInput,
    keyPrefix: string,
    hashedKey: string,
  ): Promise<ApiKey>;
  revoke(storeId: string, id: string, revokedAt: string): Promise<ApiKey>;
  recordLastUsed(storeId: string, id: string, lastUsedAt: string): Promise<void>;
}

export type ApiKeyRecord = ApiKey & { hashedKey: string };

export function toPermissions(value: unknown): StorePermissionCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (permission): permission is StorePermissionCode =>
      typeof permission === "string",
  );
}
