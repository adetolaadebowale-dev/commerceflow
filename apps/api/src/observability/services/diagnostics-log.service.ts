import type {
  LoggingDiagnostics,
  LoggingDiagnosticStatus,
  LoggingSummary,
} from "@commerceflow/types";

import {
  LoggingService,
  loggingService,
} from "./logging.service";
import {
  RequestCorrelationService,
  requestCorrelationService,
} from "./request-correlation.service";

export interface DiagnosticsLogServiceDependencies {
  readonly loggingService?: LoggingService;
  readonly requestCorrelationService?: RequestCorrelationService;
  readonly requestLoggingEnabled?: boolean;
  readonly recentLimit?: number;
  readonly now?: () => Date;
}

export class DiagnosticsLogService {
  private readonly loggingService: LoggingService;
  private readonly requestCorrelationService: RequestCorrelationService;
  private readonly requestLoggingEnabled: boolean;
  private readonly recentLimit: number;
  private readonly now: () => Date;

  constructor(dependencies: DiagnosticsLogServiceDependencies = {}) {
    this.loggingService = dependencies.loggingService ?? loggingService;
    this.requestCorrelationService =
      dependencies.requestCorrelationService ?? requestCorrelationService;
    this.requestLoggingEnabled = dependencies.requestLoggingEnabled ?? true;
    this.recentLimit = dependencies.recentLimit ?? 20;
    this.now = dependencies.now ?? (() => new Date());
  }

  getLoggingSummary(): LoggingSummary {
    const entries = this.loggingService.getEntries();
    return {
      totalEntries: this.loggingService.getTotalEntries(),
      byLevel: this.loggingService.getCountsByLevel(),
      recentEntries: entries.slice(-this.recentLimit).reverse(),
      checkedAt: this.now().toISOString(),
    };
  }

  getDiagnostics(): LoggingDiagnostics {
    const summary = this.getLoggingSummary();
    const activeCorrelationContexts =
      this.requestCorrelationService.getActiveContextCount();
    const lastCorrelationId =
      this.requestCorrelationService.getLastCorrelationId();

    return {
      status: this.deriveStatus(summary),
      requestLoggingEnabled: this.requestLoggingEnabled,
      activeCorrelationContexts,
      lastCorrelationId,
      summary,
      checkedAt: this.now().toISOString(),
    };
  }

  private deriveStatus(summary: LoggingSummary): LoggingDiagnosticStatus {
    if (!this.requestLoggingEnabled) {
      return "degraded";
    }

    if (summary.byLevel.error > 0 && summary.totalEntries > 0) {
      const errorRatio = summary.byLevel.error / summary.totalEntries;
      if (errorRatio >= 0.5) {
        return "degraded";
      }
    }

    return "healthy";
  }
}

export const diagnosticsLogService = new DiagnosticsLogService();
