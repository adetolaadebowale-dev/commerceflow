import type {
  CachePolicy,
  PerformanceDiagnostics,
  RateLimitSummary,
  SecurityDiagnostics,
} from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface PlatformHardeningStoreParams {
  readonly storeId: string;
}

export type UpdateCachePolicyRequest = UpdateCachePolicyInput;

export type GetPlatformSecurityResponse = ApiSuccessResponse<{
  readonly security: SecurityDiagnostics;
}>;

export type GetPlatformPerformanceResponse = ApiSuccessResponse<{
  readonly performance: PerformanceDiagnostics;
}>;

export type GetPlatformCachePoliciesResponse = ApiSuccessResponse<{
  readonly cachePolicies: readonly CachePolicy[];
}>;

export type UpdatePlatformCachePolicyResponse = ApiSuccessResponse<{
  readonly cachePolicy: CachePolicy;
}>;

export type GetPlatformRateLimitsResponse = ApiSuccessResponse<{
  readonly rateLimits: RateLimitSummary;
}>;
