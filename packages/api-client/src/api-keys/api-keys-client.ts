import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  GetApiKeyParams,
  GetApiKeyResponse,
  ListApiKeysParams,
  ListApiKeysResponse,
  RevokeApiKeyParams,
  RevokeApiKeyResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreScopedQueryString(params: { storeId: string }): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListApiKeysParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface ApiKeysClient {
  createApiKey(
    input: CreateApiKeyRequest,
  ): Promise<CreateApiKeyResponse["data"]>;
  listApiKeys(params: ListApiKeysParams): Promise<ListApiKeysResponse["data"]>;
  getApiKey(
    id: string,
    params: GetApiKeyParams,
  ): Promise<GetApiKeyResponse["data"]>;
  revokeApiKey(
    id: string,
    params: RevokeApiKeyParams,
  ): Promise<RevokeApiKeyResponse["data"]>;
}

export function createApiKeysClient(config: ApiClientConfig): ApiKeysClient {
  return {
    createApiKey: (input) =>
      apiRequest<CreateApiKeyResponse["data"]>(config, {
        method: "POST",
        path: "/api/api-keys",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listApiKeys: (params) =>
      apiRequest<ListApiKeysResponse["data"]>(config, {
        method: "GET",
        path: `/api/api-keys${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getApiKey: (id, params) =>
      apiRequest<GetApiKeyResponse["data"]>(config, {
        method: "GET",
        path: `/api/api-keys/${id}${toStoreScopedQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    revokeApiKey: (id, params) =>
      apiRequest<RevokeApiKeyResponse["data"]>(config, {
        method: "POST",
        path: `/api/api-keys/${id}/revoke${toStoreScopedQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
