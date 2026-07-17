import type {
  AuthorizedApiKeyContext,
  StorePermissionCode,
} from "@commerceflow/types";

import { getBearerToken } from "@/auth/routes/request-utils";
import { API_KEY_ERROR_CODES, ApiKeyError } from "../errors";
import { getApiKeyRepository, type ApiKeyRepository } from "../repositories";
import {
  extractKeyPrefixFromSecret,
  isApiKeyToken,
  verifyApiKeySecret,
} from "./api-key-crypto.service";

export interface ApiKeyAuthenticationServiceDependencies {
  readonly apiKeyRepository?: ApiKeyRepository;
}

export class ApiKeyAuthenticationService {
  private readonly apiKeyRepository: ApiKeyRepository;

  constructor(dependencies: ApiKeyAuthenticationServiceDependencies = {}) {
    this.apiKeyRepository =
      dependencies.apiKeyRepository ?? getApiKeyRepository();
  }

  async authenticateRequest(
    request: Request,
    storeId: string,
    permission: StorePermissionCode,
  ): Promise<AuthorizedApiKeyContext> {
    const token = getBearerToken(request);

    if (!token) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "API key credentials were not provided",
        401,
      );
    }

    return this.authenticateToken(token, storeId, permission);
  }

  async authenticateToken(
    token: string,
    storeId: string,
    permission: StorePermissionCode,
  ): Promise<AuthorizedApiKeyContext> {
    if (!isApiKeyToken(token)) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "Invalid API key format",
        401,
      );
    }

    const keyPrefix = extractKeyPrefixFromSecret(token);

    if (!keyPrefix) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "Invalid API key format",
        401,
      );
    }

    const record = await this.apiKeyRepository.findByKeyPrefixWithHash(keyPrefix);

    if (!record) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "Invalid API key",
        401,
      );
    }

    if (record.storeId !== storeId) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "Invalid API key for this store",
        401,
      );
    }

    const valid = await verifyApiKeySecret(token, record.hashedKey);

    if (!valid) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INVALID_KEY,
        "Invalid API key",
        401,
      );
    }

    if (record.revokedAt) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.REVOKED,
        "API key has been revoked",
        401,
      );
    }

    if (record.expiresAt && new Date(record.expiresAt) <= new Date()) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.EXPIRED,
        "API key has expired",
        401,
      );
    }

    if (!record.permissions.includes(permission)) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.INSUFFICIENT_PERMISSION,
        "API key lacks the required permission",
        403,
      );
    }

    const lastUsedAt = new Date().toISOString();
    await this.apiKeyRepository.recordLastUsed(storeId, record.id, lastUsedAt);

    return {
      apiKeyId: record.id,
      storeId,
      permissions: record.permissions,
      permission,
    };
  }
}

export const apiKeyAuthenticationService = new ApiKeyAuthenticationService();
