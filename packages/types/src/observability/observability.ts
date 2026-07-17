/** Supported structured log levels. */
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export const LOGGING_DIAGNOSTIC_STATUSES = ["healthy", "degraded"] as const;

export type LoggingDiagnosticStatus =
  (typeof LOGGING_DIAGNOSTIC_STATUSES)[number];

/** Request correlation context propagated across a single request lifecycle. */
export interface CorrelationContext {
  readonly correlationId: string;
  readonly requestId: string;
  readonly method?: string;
  readonly path?: string;
  readonly storeId?: string;
  readonly userId?: string;
  readonly startedAt: string;
}

/** Standardized structured log entry. */
export interface StructuredLogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

/** Operational log summary for operators. */
export interface LoggingSummary {
  readonly totalEntries: number;
  readonly byLevel: Readonly<Record<LogLevel, number>>;
  readonly recentEntries: readonly StructuredLogEntry[];
  readonly checkedAt: string;
}

/** Aggregate logging/observability diagnostics. */
export interface LoggingDiagnostics {
  readonly status: LoggingDiagnosticStatus;
  readonly requestLoggingEnabled: boolean;
  readonly activeCorrelationContexts: number;
  readonly lastCorrelationId?: string;
  readonly summary: LoggingSummary;
  readonly checkedAt: string;
}
