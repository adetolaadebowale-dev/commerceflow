import {
  Prisma,
  type PlatformConfiguration as PrismaPlatformConfiguration,
  type PrismaClient,
} from "@prisma/client";
import type {
  BackupConfiguration,
  BackupProvider,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBackupConfiguration(value: Prisma.JsonValue): BackupConfiguration {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return { ...DEFAULT_BACKUP_CONFIGURATION };
  }

  const provider = value.provider;
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : false,
    provider:
      provider === "manual" || provider === "managed" || provider === "unknown"
        ? (provider as BackupProvider)
        : "unknown",
    scheduleCron:
      typeof value.scheduleCron === "string" ? value.scheduleCron : undefined,
    retentionDays:
      typeof value.retentionDays === "number" ? value.retentionDays : 7,
    lastVerifiedAt:
      typeof value.lastVerifiedAt === "string"
        ? value.lastVerifiedAt
        : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
  };
}

function parseRecoveryObjectives(value: Prisma.JsonValue): RecoveryObjectives {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return defaultRecoveryObjectives();
  }

  return {
    rpoMinutes:
      typeof value.rpoMinutes === "number" ? value.rpoMinutes : 1_440,
    rtoMinutes: typeof value.rtoMinutes === "number" ? value.rtoMinutes : 240,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class PrismaDisasterReadinessConfigurationRepository
  implements DisasterReadinessConfigurationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async getBackupConfiguration(): Promise<BackupConfiguration> {
    const configuration = await this.ensureConfiguration();
    return parseBackupConfiguration(configuration.backupConfiguration);
  }

  async updateBackupConfiguration(
    input: Omit<UpdateBackupConfigurationInput, "storeId">,
  ): Promise<BackupConfiguration> {
    const configuration = await this.ensureConfiguration();
    const current = parseBackupConfiguration(configuration.backupConfiguration);
    const next: BackupConfiguration = {
      enabled: input.enabled,
      provider: input.provider,
      scheduleCron: input.scheduleCron,
      retentionDays: input.retentionDays,
      lastVerifiedAt:
        input.lastVerifiedAt === null || input.lastVerifiedAt === undefined
          ? undefined
          : input.lastVerifiedAt,
      notes: input.notes ?? current.notes,
    };

    await this.db.platformConfiguration.update({
      where: { id: configuration.id },
      data: { backupConfiguration: toJson(next) },
    });

    return next;
  }

  async getRecoveryObjectives(): Promise<RecoveryObjectives> {
    const configuration = await this.ensureConfiguration();
    return parseRecoveryObjectives(configuration.recoveryObjectives);
  }

  async updateRecoveryObjectives(
    input: Omit<UpdateRecoveryObjectivesInput, "storeId">,
  ): Promise<RecoveryObjectives> {
    const configuration = await this.ensureConfiguration();
    const next: RecoveryObjectives = {
      rpoMinutes: input.rpoMinutes,
      rtoMinutes: input.rtoMinutes,
      updatedAt: new Date().toISOString(),
    };

    await this.db.platformConfiguration.update({
      where: { id: configuration.id },
      data: { recoveryObjectives: toJson(next) },
    });

    return next;
  }

  private async ensureConfiguration(): Promise<PrismaPlatformConfiguration> {
    const existing = await this.db.platformConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      return existing;
    }

    return this.db.platformConfiguration.create({
      data: {
        maintenanceMode: false,
        backupConfiguration: toJson(DEFAULT_BACKUP_CONFIGURATION),
        recoveryObjectives: toJson(defaultRecoveryObjectives()),
      },
    });
  }
}
