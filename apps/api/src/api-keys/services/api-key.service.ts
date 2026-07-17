import type { ApiKey, ApiKeyWithSecret, StorePermissionCode } from "@commerceflow/types";
import type { CreateApiKeyInput, ListApiKeysQuery } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { API_KEY_ERROR_CODES, ApiKeyError } from "../errors";
import { getApiKeyRepository, type ApiKeyRepository } from "../repositories";
import { generateApiKeyMaterial } from "./api-key-crypto.service";

export interface ApiKeyServiceDependencies {
  readonly apiKeyRepository?: ApiKeyRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ApiKeyService {
  private readonly apiKeyRepository: ApiKeyRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ApiKeyServiceDependencies = {}) {
    this.apiKeyRepository =
      dependencies.apiKeyRepository ?? getApiKeyRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createApiKey(input: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    const material = await generateApiKeyMaterial();

    let apiKey: ApiKey;

    try {
      apiKey = await this.apiKeyRepository.create(
        input,
        material.keyPrefix,
        material.hashedKey,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishApiKeyCreated(apiKey);

    return {
      ...apiKey,
      secretKey: material.secretKey,
    };
  }

  async getApiKey(storeId: string, id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findById(storeId, id);

    if (!apiKey) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.NOT_FOUND,
        "API key not found",
        404,
      );
    }

    return apiKey;
  }

  async listApiKeys(query: ListApiKeysQuery) {
    return this.apiKeyRepository.list(query);
  }

  async revokeApiKey(storeId: string, id: string): Promise<ApiKey> {
    const existing = await this.getApiKey(storeId, id);

    if (existing.revokedAt) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.ALREADY_REVOKED,
        "API key is already revoked",
        409,
      );
    }

    let revoked: ApiKey;

    try {
      revoked = await this.apiKeyRepository.revoke(
        storeId,
        id,
        new Date().toISOString(),
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishApiKeyRevoked(revoked);
    return revoked;
  }

  assertAssignablePermissions(
    permissions: readonly StorePermissionCode[],
  ): void {
    if (permissions.some((permission) => permission.startsWith("api-keys:"))) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.VALIDATION_ERROR,
        "API keys cannot be granted api-keys permissions",
        400,
      );
    }
  }

  private mapRepositoryError(error: unknown): ApiKeyError {
    if (error instanceof ApiKeyError) {
      return error;
    }

    return new ApiKeyError(
      API_KEY_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "API key repository error",
      500,
    );
  }
}

export const apiKeyService = new ApiKeyService();
