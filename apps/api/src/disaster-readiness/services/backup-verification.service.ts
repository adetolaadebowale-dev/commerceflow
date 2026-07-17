import type {
  BackupDiagnostics,
  BackupVerificationStatus,
  BackupVerificationStatusCode,
} from "@commerceflow/types";

import {
  getDisasterReadinessConfigurationRepository,
  type DisasterReadinessConfigurationRepository,
} from "../repositories";

export interface BackupVerificationServiceDependencies {
  readonly configurationRepository?: DisasterReadinessConfigurationRepository;
  readonly staleAfterHours?: number;
  readonly now?: () => Date;
}

export class BackupVerificationService {
  private readonly configurationRepository: DisasterReadinessConfigurationRepository;
  private readonly staleAfterHours: number;
  private readonly now: () => Date;

  constructor(dependencies: BackupVerificationServiceDependencies = {}) {
    this.configurationRepository =
      dependencies.configurationRepository ??
      getDisasterReadinessConfigurationRepository();
    this.staleAfterHours = dependencies.staleAfterHours ?? 168;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getVerificationStatus(): Promise<BackupVerificationStatus> {
    const configuration =
      await this.configurationRepository.getBackupConfiguration();
    const checkedAt = this.now().toISOString();
    const checks = [
      {
        name: "backup_enabled",
        status: configuration.enabled
          ? ("pass" as const)
          : ("warn" as const),
        message: configuration.enabled
          ? "Backup configuration is enabled"
          : "Backup configuration is disabled",
      },
      {
        name: "retention_policy",
        status:
          configuration.retentionDays >= 7
            ? ("pass" as const)
            : ("warn" as const),
        message: `Retention is ${configuration.retentionDays} day(s)`,
      },
      {
        name: "verification_freshness",
        ...this.evaluateFreshness(configuration.lastVerifiedAt),
      },
    ];

    return {
      status: this.deriveStatus(checks),
      lastVerifiedAt: configuration.lastVerifiedAt,
      checks,
      checkedAt,
    };
  }

  async getBackupDiagnostics(): Promise<BackupDiagnostics> {
    const [configuration, verification] = await Promise.all([
      this.configurationRepository.getBackupConfiguration(),
      this.getVerificationStatus(),
    ]);

    return {
      configuration,
      verification,
      checkedAt: this.now().toISOString(),
    };
  }

  private evaluateFreshness(lastVerifiedAt?: string): {
    status: "pass" | "warn" | "fail";
    message: string;
  } {
    if (!lastVerifiedAt) {
      return {
        status: "fail",
        message: "No backup verification timestamp is recorded",
      };
    }

    const ageHours =
      (this.now().getTime() - new Date(lastVerifiedAt).getTime()) /
      (1000 * 60 * 60);

    if (Number.isNaN(ageHours) || ageHours < 0) {
      return {
        status: "fail",
        message: "Backup verification timestamp is invalid",
      };
    }

    if (ageHours > this.staleAfterHours) {
      return {
        status: "warn",
        message: `Last verification is ${Math.floor(ageHours)} hour(s) old`,
      };
    }

    return {
      status: "pass",
      message: "Backup verification is within the freshness window",
    };
  }

  private deriveStatus(
    checks: BackupVerificationStatus["checks"],
  ): BackupVerificationStatusCode {
    if (checks.some((check) => check.status === "fail")) {
      return "failed";
    }

    const freshness = checks.find(
      (check) => check.name === "verification_freshness",
    );
    if (freshness?.status === "warn") {
      return "stale";
    }

    if (checks.some((check) => check.status === "warn")) {
      return "unverified";
    }

    return "verified";
  }
}
export const backupVerificationService = new BackupVerificationService();
