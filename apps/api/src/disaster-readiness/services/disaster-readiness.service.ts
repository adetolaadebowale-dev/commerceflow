import type {
  DisasterReadinessStatus,
  DisasterReadinessSummary,
} from "@commerceflow/types";

import {
  BackupVerificationService,
  backupVerificationService,
} from "./backup-verification.service";
import {
  RecoveryPlanService,
  recoveryPlanService,
} from "./recovery-plan.service";

export interface DisasterReadinessServiceDependencies {
  readonly backupVerificationService?: BackupVerificationService;
  readonly recoveryPlanService?: RecoveryPlanService;
  readonly now?: () => Date;
}

export class DisasterReadinessService {
  private readonly backupVerificationService: BackupVerificationService;
  private readonly recoveryPlanService: RecoveryPlanService;
  private readonly now: () => Date;

  constructor(dependencies: DisasterReadinessServiceDependencies = {}) {
    this.backupVerificationService =
      dependencies.backupVerificationService ?? backupVerificationService;
    this.recoveryPlanService =
      dependencies.recoveryPlanService ?? recoveryPlanService;
    this.now = dependencies.now ?? (() => new Date());
  }

  async getSummary(): Promise<DisasterReadinessSummary> {
    const [backups, recovery] = await Promise.all([
      this.backupVerificationService.getBackupDiagnostics(),
      this.recoveryPlanService.getRecoveryPlan(),
    ]);

    return {
      status: this.deriveStatus(backups.verification.status, recovery.objectives),
      backups,
      recovery,
      checkedAt: this.now().toISOString(),
    };
  }

  private deriveStatus(
    verificationStatus: DisasterReadinessSummary["backups"]["verification"]["status"],
    objectives: DisasterReadinessSummary["recovery"]["objectives"],
  ): DisasterReadinessStatus {
    if (verificationStatus === "failed") {
      return "not_ready";
    }

    if (
      verificationStatus === "unverified" ||
      verificationStatus === "stale" ||
      objectives.rpoMinutes > 2_880 ||
      objectives.rtoMinutes > 480
    ) {
      return "needs_attention";
    }

    return "ready";
  }
}

export const disasterReadinessService = new DisasterReadinessService();
