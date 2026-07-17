/** Platform process and dependency health status. */
export const PLATFORM_HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
] as const;

export type PlatformHealthStatus = (typeof PLATFORM_HEALTH_STATUSES)[number];

/** Individual health check result. */
export const PLATFORM_CHECK_STATUSES = ["pass", "warn", "fail"] as const;

export type PlatformCheckStatus = (typeof PLATFORM_CHECK_STATUSES)[number];

export interface PlatformHealthCheck {
  readonly name: string;
  readonly status: PlatformCheckStatus;
  readonly message?: string;
}

/** Persisted platform maintenance configuration. */
export interface MaintenanceMode {
  readonly maintenanceMode: boolean;
  readonly maintenanceMessage?: string;
  readonly updatedAt: string;
}

/** System health summary for operators. */
export interface PlatformHealth {
  readonly status: PlatformHealthStatus;
  readonly checks: readonly PlatformHealthCheck[];
  readonly maintenance: MaintenanceMode;
  readonly checkedAt: string;
}

/** Readiness probe result. */
export interface PlatformReadiness {
  readonly ready: boolean;
  readonly checks: readonly PlatformHealthCheck[];
  readonly checkedAt: string;
}

/** Liveness probe result. */
export interface PlatformLiveness {
  readonly live: boolean;
  readonly checkedAt: string;
}

/** Application version metadata. */
export interface PlatformVersion {
  readonly name: string;
  readonly version: string;
  readonly environment: string;
  readonly nodeVersion: string;
}

/** Configuration validation item. */
export const CONFIGURATION_VALIDATION_STATUSES = [
  "ok",
  "missing",
  "invalid",
] as const;

export type ConfigurationValidationStatus =
  (typeof CONFIGURATION_VALIDATION_STATUSES)[number];

export interface ConfigurationValidationItem {
  readonly key: string;
  readonly status: ConfigurationValidationStatus;
  readonly message?: string;
}

export interface ConfigurationValidationSummary {
  readonly valid: boolean;
  readonly items: readonly ConfigurationValidationItem[];
}

/** Background job statistics for a store context. */
export interface PlatformJobSummary {
  readonly storeId: string;
  readonly total: number;
  readonly byStatus: {
    readonly pending: number;
    readonly running: number;
    readonly completed: number;
    readonly failed: number;
  };
  readonly oldestPendingScheduledFor?: string;
}

/** Combined diagnostics snapshot. */
export interface PlatformDiagnostics {
  readonly version: PlatformVersion;
  readonly maintenance: MaintenanceMode;
  readonly configuration: ConfigurationValidationSummary;
  readonly jobs: PlatformJobSummary;
  readonly health: PlatformHealth;
  readonly checkedAt: string;
}
