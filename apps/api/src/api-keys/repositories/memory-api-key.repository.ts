import { buildCatalogueListResult, type ApiKey } from "@commerceflow/types";
import type { CreateApiKeyInput, ListApiKeysQuery } from "@commerceflow/validation";

import type { ApiKeyRepository } from "./api-key.repository";

interface StoredApiKey extends ApiKey {
  hashedKey: string;
}

export class MemoryApiKeyRepository implements ApiKeyRepository {
  private readonly keysById = new Map<string, StoredApiKey>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<ApiKey | null> {
    const record = this.keysById.get(id);
    return record?.storeId === storeId ? this.toPublic(record) : null;
  }

  async findByKeyPrefix(keyPrefix: string): Promise<ApiKey | null> {
    for (const record of this.keysById.values()) {
      if (record.keyPrefix === keyPrefix) {
        return this.toPublic(record);
      }
    }

    return null;
  }

  async findByKeyPrefixWithHash(
    keyPrefix: string,
  ): Promise<(ApiKey & { hashedKey: string }) | null> {
    for (const record of this.keysById.values()) {
      if (record.keyPrefix === keyPrefix) {
        return record;
      }
    }

    return null;
  }

  async list(query: ListApiKeysQuery) {
    const items = [...this.keysById.values()]
      .filter((record) => record.storeId === query.storeId)
      .sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          left.id.localeCompare(right.id),
      );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map((record) =>
        this.toPublic(record),
      ),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(
    input: CreateApiKeyInput,
    keyPrefix: string,
    hashedKey: string,
  ): Promise<ApiKey> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const record: StoredApiKey = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name,
      keyPrefix,
      hashedKey,
      permissions: input.permissions,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    this.keysById.set(record.id, record);
    return this.toPublic(record);
  }

  async revoke(storeId: string, id: string, revokedAt: string): Promise<ApiKey> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.keysById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`API key not found: ${id}`);
    }

    const updated: StoredApiKey = {
      ...existing,
      revokedAt,
      updatedAt: new Date().toISOString(),
    };

    this.keysById.set(id, updated);
    return this.toPublic(updated);
  }

  async recordLastUsed(
    storeId: string,
    id: string,
    lastUsedAt: string,
  ): Promise<void> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.keysById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`API key not found: ${id}`);
    }

    this.keysById.set(id, {
      ...existing,
      lastUsedAt,
      updatedAt: new Date().toISOString(),
    });
  }

  private toPublic(record: StoredApiKey): ApiKey {
    return {
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      keyPrefix: record.keyPrefix,
      permissions: record.permissions,
      lastUsedAt: record.lastUsedAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
