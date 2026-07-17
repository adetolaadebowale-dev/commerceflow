import type { ApiKey, ApiKeyWithSecret } from "@commerceflow/types";
import type { CreateApiKeyInput, ListApiKeysQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type CreateApiKeyRequest = CreateApiKeyInput;
export type CreateApiKeyResponse = ApiSuccessResponse<{
  apiKey: ApiKeyWithSecret;
}>;

export type ListApiKeysParams = ListApiKeysQuery;
export type ListApiKeysResponse = ApiSuccessResponse<{
  items: readonly ApiKey[];
  total: number;
  page: number;
  limit: number;
}>;

export type GetApiKeyParams = { storeId: string };
export type GetApiKeyResponse = ApiSuccessResponse<{ apiKey: ApiKey }>;

export type RevokeApiKeyParams = { storeId: string };
export type RevokeApiKeyResponse = ApiSuccessResponse<{ apiKey: ApiKey }>;
