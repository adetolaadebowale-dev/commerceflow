import type {
  GetPlatformCachePoliciesResponse,
  GetPlatformPerformanceResponse,
  GetPlatformRateLimitsResponse,
  GetPlatformSecurityResponse,
  PlatformHardeningStoreParams,
  UpdateCachePolicyRequest,
  UpdatePlatformCachePolicyResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toStoreQueryString(params: PlatformHardeningStoreParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  return `?${searchParams.toString()}`;
}

export interface PlatformHardeningClient {
  getSecurity(
    params: PlatformHardeningStoreParams,
  ): Promise<GetPlatformSecurityResponse["data"]>;
  getPerformance(
    params: PlatformHardeningStoreParams,
  ): Promise<GetPlatformPerformanceResponse["data"]>;
  listCachePolicies(
    params: PlatformHardeningStoreParams,
  ): Promise<GetPlatformCachePoliciesResponse["data"]>;
  updateCachePolicy(
    input: UpdateCachePolicyRequest,
  ): Promise<UpdatePlatformCachePolicyResponse["data"]>;
  getRateLimits(
    params: PlatformHardeningStoreParams,
  ): Promise<GetPlatformRateLimitsResponse["data"]>;
}

export function createPlatformHardeningClient(
  config: ApiClientConfig,
): PlatformHardeningClient {
  return {
    getSecurity: (params) =>
      apiRequest<GetPlatformSecurityResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/security${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPerformance: (params) =>
      apiRequest<GetPlatformPerformanceResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/performance${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listCachePolicies: (params) =>
      apiRequest<GetPlatformCachePoliciesResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/cache-policies${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateCachePolicy: (input) =>
      apiRequest<UpdatePlatformCachePolicyResponse["data"]>(config, {
        method: "PATCH",
        path: "/api/platform/cache-policies",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getRateLimits: (params) =>
      apiRequest<GetPlatformRateLimitsResponse["data"]>(config, {
        method: "GET",
        path: `/api/platform/rate-limits${toStoreQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
