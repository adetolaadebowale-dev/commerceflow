import type {
  BackupConfiguration,
  RecoveryObjectives,
} from "@commerceflow/types";
import type {
  UpdateBackupConfigurationInput,
  UpdateRecoveryObjectivesInput,
} from "@commerceflow/validation";

export const DEFAULT_BACKUP_CONFIGURATION: BackupConfiguration = {
  enabled: false,
  provider: "manual",
  retentionDays: 7,
  notes: "Backup execution is external to CommerceFlow",
};

export function defaultRecoveryObjectives(
  now = new Date().toISOString(),
): RecoveryObjectives {
  return {
    rpoMinutes: 1_440,
    rtoMinutes: 240,
    updatedAt: now,
  };
}

export interface DisasterReadinessConfigurationRepository {
  getBackupConfiguration(): Promise<BackupConfiguration>;
  updateBackupConfiguration(
    input: Omit<UpdateBackupConfigurationInput, "storeId">,
  ): Promise<BackupConfiguration>;
  getRecoveryObjectives(): Promise<RecoveryObjectives>;
  updateRecoveryObjectives(
    input: Omit<UpdateRecoveryObjectivesInput, "storeId">,
  ): Promise<RecoveryObjectives>;
}
