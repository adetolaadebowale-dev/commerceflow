/** Security review check result. */
export const SECURITY_CHECK_STATUSES = ["pass", "warn", "fail"] as const;

export type SecurityCheckStatus = (typeof SECURITY_CHECK_STATUSES)[number];

export const SECURITY_DIAGNOSTIC_STATUSES = [
  "secure",
  "needs_attention",
  "at_risk",
] as const;

export type SecurityDiagnosticStatus =
  (typeof SECURITY_DIAGNOSTIC_STATUSES)[number];

export interface SecurityCheck {
  readonly name: string;
  readonly status: SecurityCheckStatus;
  readonly message?: string;
}

/** Aggregate security diagnostics for operators. */
export interface SecurityDiagnostics {
  readonly status: SecurityDiagnosticStatus;
  readonly checks: readonly SecurityCheck[];
  readonly checkedAt: string;
}

/** In-memory rate limit policy for a selected endpoint key. */
export interface RateLimitPolicy {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
  readonly enabled: boolean;
  readonly description?: string;
}

/** Current bucket status for a rate limit key. */
export interface RateLimitBucketStatus {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
  readonly remaining: number;
  readonly resetAt: string;
  readonly enabled: boolean;
}

export interface RateLimitSummary {
  readonly policies: readonly RateLimitPolicy[];
  readonly buckets: readonly RateLimitBucketStatus[];
  readonly checkedAt: string;
}

/** Cache policy definition for a read-heavy resource. */
export interface CachePolicy {
  readonly resource: string;
  readonly enabled: boolean;
  readonly ttlSeconds: number;
  readonly description?: string;
  readonly updatedAt: string;
}

/** Recorded timing sample for performance diagnostics. */
export interface PerformanceTimingSummary {
  readonly operation: string;
  readonly count: number;
  readonly averageMs: number;
  readonly minMs: number;
  readonly maxMs: number;
}

export interface SlowOperationReport {
  readonly operation: string;
  readonly durationMs: number;
  readonly recordedAt: string;
}

export interface PerformanceDiagnostics {
  readonly timings: readonly PerformanceTimingSummary[];
  readonly slowOperations: readonly SlowOperationReport[];
  readonly slowThresholdMs: number;
  readonly checkedAt: string;
}
