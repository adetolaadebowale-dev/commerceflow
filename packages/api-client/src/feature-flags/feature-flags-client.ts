import type {
  EffectiveFeatureFlagsParams,
  EffectiveFeatureFlagsResponse,
  ListFeatureFlagsParams,
  ListFeatureFlagsResponse,
  UpsertFeatureFlagParams,
  UpsertFeatureFlagRequest,
  UpsertFeatureFlagResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toListQueryString(params: ListFeatureFlagsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toEffectiveQueryString(params: EffectiveFeatureFlagsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);

  if (params.keys && params.keys.length > 0) {
    searchParams.set("keys", params.keys.join(","));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toStoreScopedQueryString(params: UpsertFeatureFlagParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface FeatureFlagsClient {
  listFeatureFlags(
    params: ListFeatureFlagsParams,
  ): Promise<ListFeatureFlagsResponse["data"]>;
  getEffectiveFeatureFlags(
    params: EffectiveFeatureFlagsParams,
  ): Promise<EffectiveFeatureFlagsResponse["data"]>;
  upsertFeatureFlag(
    key: string,
    params: UpsertFeatureFlagParams,
    input: UpsertFeatureFlagRequest,
  ): Promise<UpsertFeatureFlagResponse["data"]>;
}

export function createFeatureFlagsClient(
  config: ApiClientConfig,
): FeatureFlagsClient {
  return {
    listFeatureFlags: (params) =>
      apiRequest<ListFeatureFlagsResponse["data"]>(config, {
        method: "GET",
        path: `/api/feature-flags${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getEffectiveFeatureFlags: (params) =>
      apiRequest<EffectiveFeatureFlagsResponse["data"]>(config, {
        method: "GET",
        path: `/api/feature-flags/effective${toEffectiveQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    upsertFeatureFlag: (key, params, input) =>
      apiRequest<UpsertFeatureFlagResponse["data"]>(config, {
        method: "PUT",
        path: `/api/feature-flags/${encodeURIComponent(key)}${toStoreScopedQueryString(params)}`,
        body: { ...input, storeId: params.storeId },
        accessToken: config.getAccessToken?.(),
      }),
  };
}
