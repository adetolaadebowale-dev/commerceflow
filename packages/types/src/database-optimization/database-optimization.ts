/** Database optimization diagnostic status. */
export const DATABASE_DIAGNOSTIC_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
] as const;

export type DatabaseDiagnosticStatus =
  (typeof DATABASE_DIAGNOSTIC_STATUSES)[number];

export const QUERY_RECOMMENDATION_SEVERITIES = [
  "info",
  "warn",
  "critical",
] as const;

export type QueryRecommendationSeverity =
  (typeof QUERY_RECOMMENDATION_SEVERITIES)[number];

/** Declared or reviewed database index. */
export interface IndexDefinition {
  readonly table: string;
  readonly name: string;
  readonly columns: readonly string[];
  readonly unique: boolean;
  readonly recommendation?: string;
}

/** Index inventory summary. */
export interface IndexSummary {
  readonly total: number;
  readonly byTable: Readonly<Record<string, number>>;
  readonly indexes: readonly IndexDefinition[];
  readonly checkedAt: string;
}

/** Development slow-query sample. */
export interface SlowQuerySample {
  readonly queryKey: string;
  readonly durationMs: number;
  readonly recordedAt: string;
}

/** Query performance recommendation. */
export interface QueryPerformanceRecommendation {
  readonly code: string;
  readonly severity: QueryRecommendationSeverity;
  readonly message: string;
  readonly relatedTable?: string;
}

export interface QueryPerformanceSummary {
  readonly sampleCount: number;
  readonly slowSamples: readonly SlowQuerySample[];
  readonly recommendations: readonly QueryPerformanceRecommendation[];
  readonly slowThresholdMs: number;
  readonly checkedAt: string;
}

/** Migration folder consistency check. */
export interface MigrationConsistencyResult {
  readonly consistent: boolean;
  readonly migrationCount: number;
  readonly issues: readonly string[];
}

/** Aggregate database diagnostics. */
export interface DatabaseDiagnostics {
  readonly status: DatabaseDiagnosticStatus;
  readonly databaseReachable: boolean;
  readonly indexes: IndexSummary;
  readonly queryPerformance: QueryPerformanceSummary;
  readonly migrations: MigrationConsistencyResult;
  readonly checkedAt: string;
}
