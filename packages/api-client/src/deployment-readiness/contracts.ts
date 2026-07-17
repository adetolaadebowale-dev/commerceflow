import type {
  DeploymentChecklistItem,
  DeploymentConfiguration,
  DeploymentReadiness,
  EnvironmentDiagnostics,
  ReleaseMetadata,
} from "@commerceflow/types";
import type { UpdateDeploymentConfigurationInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface DeploymentReadinessStoreParams {
  readonly storeId: string;
}

export type UpdateDeploymentConfigurationRequest =
  UpdateDeploymentConfigurationInput;

export type GetPlatformDeploymentResponse = ApiSuccessResponse<{
  readonly deployment: DeploymentReadiness;
}>;

export type UpdatePlatformDeploymentResponse = ApiSuccessResponse<{
  readonly configuration: DeploymentConfiguration;
}>;

export type GetPlatformDeploymentChecklistResponse = ApiSuccessResponse<{
  readonly checklist: readonly DeploymentChecklistItem[];
}>;

export type GetPlatformEnvironmentResponse = ApiSuccessResponse<{
  readonly environment: EnvironmentDiagnostics;
}>;

export type GetPlatformReleaseResponse = ApiSuccessResponse<{
  readonly release: ReleaseMetadata;
}>;
