import type {
  EffectiveFeatureFlag,
  FeatureFlag,
} from "@commerceflow/types";
import type { UpsertFeatureFlagInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface ListFeatureFlagsParams {
  readonly storeId: string;
  readonly page: number;
  readonly limit: number;
}

export interface EffectiveFeatureFlagsParams {
  readonly storeId: string;
  readonly keys?: readonly string[];
}

export interface UpsertFeatureFlagParams {
  readonly storeId: string;
}

export type UpsertFeatureFlagRequest = Omit<UpsertFeatureFlagInput, "storeId">;

export type ListFeatureFlagsResponse = ApiSuccessResponse<{
  readonly items: readonly FeatureFlag[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}>;

export type EffectiveFeatureFlagsResponse = ApiSuccessResponse<{
  readonly items: readonly EffectiveFeatureFlag[];
}>;

export type UpsertFeatureFlagResponse = ApiSuccessResponse<{
  readonly featureFlag: FeatureFlag;
}>;
