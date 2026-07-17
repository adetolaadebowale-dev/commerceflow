import type {
  BackupDiagnostics,
  BackupVerificationStatus,
  DisasterReadinessSummary,
  RecoveryObjectives,
  RecoveryPlan,
} from "@commerceflow/types";
import type { UpdateRecoveryObjectivesInput } from "@commerceflow/validation";

import {
  BackupVerificationService,
  backupVerificationService,
} from "./backup-verification.service";
import {
  DisasterReadinessService,
  disasterReadinessService,
} from "./disaster-readiness.service";
import {
  RecoveryPlanService,
  recoveryPlanService,
} from "./recovery-plan.service";

export interface DisasterReadinessFacadeDependencies {
  readonly backupVerificationService?: BackupVerificationService;
  readonly recoveryPlanService?: RecoveryPlanService;
  readonly disasterReadinessService?: DisasterReadinessService;
}

export class DisasterReadinessFacade {
  private readonly backupVerificationService: BackupVerificationService;
  private readonly recoveryPlanService: RecoveryPlanService;
  private readonly disasterReadinessService: DisasterReadinessService;

  constructor(dependencies: DisasterReadinessFacadeDependencies = {}) {
    this.backupVerificationService =
      dependencies.backupVerificationService ?? backupVerificationService;
    this.recoveryPlanService =
      dependencies.recoveryPlanService ?? recoveryPlanService;
    this.disasterReadinessService =
      dependencies.disasterReadinessService ?? disasterReadinessService;
  }

  getBackups(): Promise<BackupDiagnostics> {
    return this.backupVerificationService.getBackupDiagnostics();
  }

  getBackupVerification(): Promise<BackupVerificationStatus> {
    return this.backupVerificationService.getVerificationStatus();
  }

  getRecoveryPlan(): Promise<RecoveryPlan> {
    return this.recoveryPlanService.getRecoveryPlan();
  }

  updateRecoveryObjectives(
    input: UpdateRecoveryObjectivesInput,
  ): Promise<RecoveryObjectives> {
    return this.recoveryPlanService.updateRecoveryObjectives(input);
  }

  getDisasterReadiness(): Promise<DisasterReadinessSummary> {
    return this.disasterReadinessService.getSummary();
  }
}

export const disasterReadinessFacade = new DisasterReadinessFacade();
