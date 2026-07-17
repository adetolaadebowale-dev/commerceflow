/** Backup verification check result. */
export const BACKUP_CHECK_STATUSES = ["pass", "warn", "fail"] as const;

export type BackupCheckStatus = (typeof BACKUP_CHECK_STATUSES)[number];

export const BACKUP_VERIFICATION_STATUSES = [
  "verified",
  "stale",
  "unverified",
  "failed",
] as const;

export type BackupVerificationStatusCode =
  (typeof BACKUP_VERIFICATION_STATUSES)[number];

export const BACKUP_PROVIDERS = ["manual", "managed", "unknown"] as const;

export type BackupProvider = (typeof BACKUP_PROVIDERS)[number];

export const DISASTER_READINESS_STATUSES = [
  "ready",
  "needs_attention",
  "not_ready",
] as const;

export type DisasterReadinessStatus =
  (typeof DISASTER_READINESS_STATUSES)[number];

export const RECOVERY_CHECKLIST_CATEGORIES = [
  "backup",
  "restore",
  "communication",
  "validation",
] as const;

export type RecoveryChecklistCategory =
  (typeof RECOVERY_CHECKLIST_CATEGORIES)[number];

/** Declared backup configuration (visibility only; does not execute backups). */
export interface BackupConfiguration {
  readonly enabled: boolean;
  readonly provider: BackupProvider;
  readonly scheduleCron?: string;
  readonly retentionDays: number;
  readonly lastVerifiedAt?: string;
  readonly notes?: string;
}

export interface BackupVerificationCheck {
  readonly name: string;
  readonly status: BackupCheckStatus;
  readonly message?: string;
}

export interface BackupVerificationStatus {
  readonly status: BackupVerificationStatusCode;
  readonly lastVerifiedAt?: string;
  readonly checks: readonly BackupVerificationCheck[];
  readonly checkedAt: string;
}

export interface BackupDiagnostics {
  readonly configuration: BackupConfiguration;
  readonly verification: BackupVerificationStatus;
  readonly checkedAt: string;
}

/** Recovery Point/Time objectives. */
export interface RecoveryObjectives {
  readonly rpoMinutes: number;
  readonly rtoMinutes: number;
  readonly updatedAt: string;
}

export interface RecoveryChecklistItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly required: boolean;
  readonly category: RecoveryChecklistCategory;
}

export interface RecoveryPlan {
  readonly objectives: RecoveryObjectives;
  readonly checklist: readonly RecoveryChecklistItem[];
  readonly generatedAt: string;
}

export interface DisasterReadinessSummary {
  readonly status: DisasterReadinessStatus;
  readonly backups: BackupDiagnostics;
  readonly recovery: RecoveryPlan;
  readonly checkedAt: string;
}
