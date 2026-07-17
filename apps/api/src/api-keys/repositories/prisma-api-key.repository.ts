import {
  Prisma,
  type PrismaClient,
  type ApiKey as PrismaApiKey,
} from "@prisma/client";
import { buildCatalogueListResult, type ApiKey } from "@commerceflow/types";
import type { CreateApiKeyInput, ListApiKeysQuery } from "@commerceflow/validation";

import type { ApiKeyRepository } from "./api-key.repository";
import { toPermissions } from "./api-key.repository";

function toApiKey(record: PrismaApiKey): ApiKey {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    keyPrefix: record.keyPrefix,
    permissions: toPermissions(record.permissions),
    lastUsedAt: record.lastUsedAt?.toISOString(),
    expiresAt: record.expiresAt?.toISOString(),
    revokedAt: record.revokedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toApiKeyWithHash(record: PrismaApiKey): ApiKey & { hashedKey: string } {
  return {
    ...toApiKey(record),
    hashedKey: record.hashedKey,
  };
}

export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<ApiKey | null> {
    const record = await this.db.apiKey.findFirst({
      where: { id, storeId },
    });

    return record ? toApiKey(record) : null;
  }

  async findByKeyPrefix(keyPrefix: string): Promise<ApiKey | null> {
    const record = await this.db.apiKey.findUnique({
      where: { keyPrefix },
    });

    return record ? toApiKey(record) : null;
  }

  async findByKeyPrefixWithHash(
    keyPrefix: string,
  ): Promise<(ApiKey & { hashedKey: string }) | null> {
    const record = await this.db.apiKey.findUnique({
      where: { keyPrefix },
    });

    return record ? toApiKeyWithHash(record) : null;
  }

  async list(query: ListApiKeysQuery) {
    const where = { storeId: query.storeId };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.apiKey.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.apiKey.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toApiKey),
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
    const record = await this.db.apiKey.create({
      data: {
        storeId: input.storeId,
        name: input.name,
        keyPrefix,
        hashedKey,
        permissions: input.permissions as unknown as Prisma.InputJsonValue,
        ...(input.expiresAt
          ? { expiresAt: new Date(input.expiresAt) }
          : {}),
      },
    });

    return toApiKey(record);
  }

  async revoke(storeId: string, id: string, revokedAt: string): Promise<ApiKey> {
    const result = await this.db.apiKey.updateMany({
      where: { id, storeId, revokedAt: null },
      data: { revokedAt: new Date(revokedAt) },
    });

    if (result.count === 0) {
      throw new Error(`API key not found or already revoked: ${id}`);
    }

    const record = await this.db.apiKey.findFirstOrThrow({
      where: { id, storeId },
    });

    return toApiKey(record);
  }

  async recordLastUsed(
    storeId: string,
    id: string,
    lastUsedAt: string,
  ): Promise<void> {
    await this.db.apiKey.updateMany({
      where: { id, storeId },
      data: { lastUsedAt: new Date(lastUsedAt) },
    });
  }
}
