import type {
  CorrelationContext,
  LoggingDiagnostics,
  LoggingSummary,
  StructuredLogEntry,
} from "@commerceflow/types";

import {
  DiagnosticsLogService,
  diagnosticsLogService,
} from "./diagnostics-log.service";
import {
  LoggingService,
  loggingService,
} from "./logging.service";
import {
  RequestCorrelationService,
  requestCorrelationService,
} from "./request-correlation.service";

export interface ObservabilityFacadeDependencies {
  readonly loggingService?: LoggingService;
  readonly requestCorrelationService?: RequestCorrelationService;
  readonly diagnosticsLogService?: DiagnosticsLogService;
}

export class ObservabilityFacade {
  private readonly loggingService: LoggingService;
  private readonly requestCorrelationService: RequestCorrelationService;
  private readonly diagnosticsLogService: DiagnosticsLogService;

  constructor(dependencies: ObservabilityFacadeDependencies = {}) {
    this.loggingService = dependencies.loggingService ?? loggingService;
    this.requestCorrelationService =
      dependencies.requestCorrelationService ?? requestCorrelationService;
    this.diagnosticsLogService =
      dependencies.diagnosticsLogService ?? diagnosticsLogService;
  }

  getLoggingSummary(): LoggingSummary {
    return this.diagnosticsLogService.getLoggingSummary();
  }

  getDiagnostics(): LoggingDiagnostics {
    return this.diagnosticsLogService.getDiagnostics();
  }

  createCorrelationContext(
    input?: Parameters<RequestCorrelationService["createContext"]>[0],
  ): CorrelationContext {
    return this.requestCorrelationService.createContext(input);
  }

  logRequest(
    context: CorrelationContext,
    metadata?: Record<string, unknown>,
  ): StructuredLogEntry {
    return this.loggingService.logRequest(context, metadata);
  }

  logResponse(
    context: CorrelationContext,
    status: number,
    durationMs: number,
    metadata?: Record<string, unknown>,
  ): StructuredLogEntry {
    return this.loggingService.logResponse(
      context,
      status,
      durationMs,
      metadata,
    );
  }

  logError(
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>,
  ): StructuredLogEntry {
    return this.loggingService.error(message, error, metadata);
  }
}

export const observabilityFacade = new ObservabilityFacade();
