import type {
  MaintenanceMode,
  PlatformDiagnostics,
  PlatformHealth,
  PlatformJobSummary,
  PlatformLiveness,
  PlatformReadiness,
  PlatformVersion,
} from "@commerceflow/types";
import type { UpdateMaintenanceModeInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface PlatformStoreParams {
  readonly storeId: string;
}

export type UpdateMaintenanceModeRequest = UpdateMaintenanceModeInput;

export type GetPlatformHealthResponse = ApiSuccessResponse<{
  readonly health: PlatformHealth;
}>;

export type GetPlatformReadinessResponse = ApiSuccessResponse<{
  readonly readiness: PlatformReadiness;
}>;

export type GetPlatformLivenessResponse = ApiSuccessResponse<{
  readonly liveness: PlatformLiveness;
}>;

export type GetPlatformVersionResponse = ApiSuccessResponse<{
  readonly version: PlatformVersion;
}>;

export type GetPlatformDiagnosticsResponse = ApiSuccessResponse<{
  readonly diagnostics: PlatformDiagnostics;
}>;

export type GetPlatformJobsSummaryResponse = ApiSuccessResponse<{
  readonly jobs: PlatformJobSummary;
}>;

export type UpdatePlatformMaintenanceResponse = ApiSuccessResponse<{
  readonly maintenance: MaintenanceMode;
}>;
