import type {
  LoadTestingConfiguration,
  LoadTestingSummary,
  PerformanceBaseline,
  ScalabilityAssessment,
} from "@commerceflow/types";
import type { UpdateLoadTestingConfigurationInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface LoadTestingStoreParams {
  readonly storeId: string;
}

export type UpdateLoadTestingConfigurationRequest =
  UpdateLoadTestingConfigurationInput;

export type GetPlatformLoadTestingResponse = ApiSuccessResponse<{
  readonly loadTesting: LoadTestingSummary;
}>;

export type UpdatePlatformLoadTestingResponse = ApiSuccessResponse<{
  readonly configuration: LoadTestingConfiguration;
}>;

export type GetPlatformLoadTestingBaselinesResponse = ApiSuccessResponse<{
  readonly baselines: PerformanceBaseline;
}>;

export type GetPlatformScalabilityResponse = ApiSuccessResponse<{
  readonly scalability: ScalabilityAssessment;
}>;
