import type {
  BackupConfiguration,
  RecoveryObjectives,
} from "@commerceflow/types";
import type {
  UpdateBackupConfigurationInput,
  UpdateRecoveryObjectivesInput,
} from "@commerceflow/validation";

import {
  DEFAULT_BACKUP_CONFIGURATION,
  defaultRecoveryObjectives,
  type DisasterReadinessConfigurationRepository,
} from "./disaster-readiness-configuration.repository";

export class MemoryDisasterReadinessConfigurationRepository
  implements DisasterReadinessConfigurationRepository
{
  private backupConfiguration: BackupConfiguration = {
    ...DEFAULT_BACKUP_CONFIGURATION,
  };
  private recoveryObjectives: RecoveryObjectives = defaultRecoveryObjectives(
    new Date(0).toISOString(),
  );

  seedBackupConfiguration(configuration: BackupConfiguration): void {
    this.backupConfiguration = configuration;
  }

  seedRecoveryObjectives(objectives: RecoveryObjectives): void {
    this.recoveryObjectives = objectives;
  }

  async getBackupConfiguration(): Promise<BackupConfiguration> {
    return this.backupConfiguration;
  }

  async updateBackupConfiguration(
    input: Omit<UpdateBackupConfigurationInput, "storeId">,
  ): Promise<BackupConfiguration> {
    this.backupConfiguration = {
      enabled: input.enabled,
      provider: input.provider,
      scheduleCron: input.scheduleCron,
      retentionDays: input.retentionDays,
      lastVerifiedAt:
        input.lastVerifiedAt === null || input.lastVerifiedAt === undefined
          ? undefined
          : input.lastVerifiedAt,
      notes: input.notes ?? this.backupConfiguration.notes,
    };
    return this.backupConfiguration;
  }

  async getRecoveryObjectives(): Promise<RecoveryObjectives> {
    return this.recoveryObjectives;
  }

  async updateRecoveryObjectives(
    input: Omit<UpdateRecoveryObjectivesInput, "storeId">,
  ): Promise<RecoveryObjectives> {
    this.recoveryObjectives = {
      rpoMinutes: input.rpoMinutes,
      rtoMinutes: input.rtoMinutes,
      updatedAt: new Date().toISOString(),
    };
    return this.recoveryObjectives;
  }
}
