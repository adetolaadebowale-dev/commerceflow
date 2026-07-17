import type {
  CorrelationContext,
  LogLevel,
  StructuredLogEntry,
} from "@commerceflow/types";

import {
  RequestCorrelationService,
  requestCorrelationService,
} from "./request-correlation.service";

export interface LoggingServiceDependencies {
  readonly requestCorrelationService?: RequestCorrelationService;
  readonly maxEntries?: number;
  readonly now?: () => Date;
  readonly sink?: (entry: StructuredLogEntry) => void;
}

function emptyByLevel(): Record<LogLevel, number> {
  return {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  };
}

export class LoggingService {
  private readonly entries: StructuredLogEntry[] = [];
  private readonly byLevel = emptyByLevel();
  private readonly requestCorrelationService: RequestCorrelationService;
  private readonly maxEntries: number;
  private readonly now: () => Date;
  private readonly sink?: (entry: StructuredLogEntry) => void;
  private activeContext: CorrelationContext | null = null;

  constructor(dependencies: LoggingServiceDependencies = {}) {
    this.requestCorrelationService =
      dependencies.requestCorrelationService ?? requestCorrelationService;
    this.maxEntries = dependencies.maxEntries ?? 500;
    this.now = dependencies.now ?? (() => new Date());
    this.sink = dependencies.sink;
  }

  setActiveContext(context: CorrelationContext | null): void {
    this.activeContext = context;
  }

  getActiveContext(): CorrelationContext | null {
    return this.activeContext;
  }

  debug(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log("debug", message, { metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log("info", message, { metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): StructuredLogEntry {
    return this.log("warn", message, { metadata });
  }

  error(
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>,
  ): StructuredLogEntry {
    return this.log("error", message, {
      metadata,
      error: this.toErrorMetadata(error),
    });
  }

  logRequest(
    context: CorrelationContext,
    metadata: Record<string, unknown> = {},
  ): StructuredLogEntry {
    this.setActiveContext(context);
    return this.info("request.started", {
      method: context.method,
      path: context.path,
      storeId: context.storeId,
      userId: context.userId,
      ...metadata,
    });
  }

  logResponse(
    context: CorrelationContext,
    status: number,
    durationMs: number,
    metadata: Record<string, unknown> = {},
  ): StructuredLogEntry {
    this.setActiveContext(context);
    const entry = this.info("request.completed", {
      method: context.method,
      path: context.path,
      status,
      durationMs,
      ...metadata,
    });
    this.requestCorrelationService.clearContext(context.requestId);
    this.setActiveContext(null);
    return entry;
  }

  getEntries(): readonly StructuredLogEntry[] {
    return [...this.entries];
  }

  getCountsByLevel(): Readonly<Record<LogLevel, number>> {
    return { ...this.byLevel };
  }

  getTotalEntries(): number {
    return this.entries.length;
  }

  private log(
    level: LogLevel,
    message: string,
    options: {
      metadata?: Record<string, unknown>;
      error?: StructuredLogEntry["error"];
    } = {},
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: this.now().toISOString(),
      correlationId: this.activeContext?.correlationId,
      requestId: this.activeContext?.requestId,
      metadata: options.metadata,
      error: options.error,
    };

    this.entries.push(entry);
    this.byLevel[level] += 1;

    if (this.entries.length > this.maxEntries) {
      const removed = this.entries.shift();
      if (removed) {
        this.byLevel[removed.level] = Math.max(
          this.byLevel[removed.level] - 1,
          0,
        );
      }
    }

    this.sink?.(entry);
    return entry;
  }

  private toErrorMetadata(
    error: unknown,
  ): StructuredLogEntry["error"] | undefined {
    if (!error) {
      return undefined;
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: "UnknownError",
      message: String(error),
    };
  }
}

export const loggingService = new LoggingService();
