import type {
  BackupDiagnostics,
  BackupVerificationStatus,
  DisasterReadinessSummary,
  RecoveryObjectives,
  RecoveryPlan,
} from "@commerceflow/types";
import type { UpdateRecoveryObjectivesInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export interface DisasterReadinessStoreParams {
  readonly storeId: string;
}

export type UpdateRecoveryObjectivesRequest = UpdateRecoveryObjectivesInput;

export type GetPlatformBackupsResponse = ApiSuccessResponse<{
  readonly backups: BackupDiagnostics;
}>;

export type GetPlatformBackupVerificationResponse = ApiSuccessResponse<{
  readonly verification: BackupVerificationStatus;
}>;

export type GetPlatformRecoveryResponse = ApiSuccessResponse<{
  readonly recovery: RecoveryPlan;
}>;

export type UpdatePlatformRecoveryResponse = ApiSuccessResponse<{
  readonly recoveryObjectives: RecoveryObjectives;
}>;

export type GetPlatformDisasterReadinessResponse = ApiSuccessResponse<{
  readonly disasterReadiness: DisasterReadinessSummary;
}>;
