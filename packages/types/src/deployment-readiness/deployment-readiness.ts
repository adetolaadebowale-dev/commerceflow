/** Deployment readiness overall status. */
export const DEPLOYMENT_READINESS_STATUSES = [
  "ready",
  "needs_attention",
  "blocked",
] as const;

export type DeploymentReadinessStatus =
  (typeof DEPLOYMENT_READINESS_STATUSES)[number];

export const ENVIRONMENT_CHECK_STATUSES = ["pass", "warn", "fail"] as const;

export type EnvironmentCheckStatus =
  (typeof ENVIRONMENT_CHECK_STATUSES)[number];

export const DEPLOYMENT_CHECKLIST_CATEGORIES = [
  "configuration",
  "database",
  "security",
  "operations",
  "release",
] as const;

export type DeploymentChecklistCategory =
  (typeof DEPLOYMENT_CHECKLIST_CATEGORIES)[number];

export const DEPLOYMENT_TARGETS = [
  "development",
  "staging",
  "production",
] as const;

export type DeploymentTarget = (typeof DEPLOYMENT_TARGETS)[number];

/** Persisted deployment configuration (visibility only; does not deploy). */
export interface DeploymentConfiguration {
  readonly target: DeploymentTarget;
  readonly requireHttps: boolean;
  readonly requireMigrationsApplied: boolean;
  readonly minimumNodeVersion: string;
  readonly releaseChannel: string;
  readonly notes?: string;
  readonly updatedAt: string;
}

export interface EnvironmentCheck {
  readonly key: string;
  readonly status: EnvironmentCheckStatus;
  readonly message?: string;
  readonly required: boolean;
}

export interface EnvironmentDiagnostics {
  readonly environment: string;
  readonly nodeVersion: string;
  readonly checks: readonly EnvironmentCheck[];
  readonly valid: boolean;
  readonly checkedAt: string;
}

export interface ReleaseMetadata {
  readonly name: string;
  readonly version: string;
  readonly channel: string;
  readonly compatibleNodeRange: string;
  readonly buildId?: string;
  readonly releasedAt?: string;
  readonly checkedAt: string;
}

export interface VersionCompatibilityDiagnostics {
  readonly compatible: boolean;
  readonly currentNodeVersion: string;
  readonly requiredNodeVersion: string;
  readonly message: string;
}

export interface DeploymentChecklistItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: DeploymentChecklistCategory;
  readonly required: boolean;
  readonly completed: boolean;
}

export interface DeploymentReadiness {
  readonly status: DeploymentReadinessStatus;
  readonly configuration: DeploymentConfiguration;
  readonly environment: EnvironmentDiagnostics;
  readonly release: ReleaseMetadata;
  readonly versionCompatibility: VersionCompatibilityDiagnostics;
  readonly checklist: readonly DeploymentChecklistItem[];
  readonly checkedAt: string;
}
