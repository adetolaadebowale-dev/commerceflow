import type {
  PerformanceDiagnostics,
  PerformanceTimingSummary,
  SlowOperationReport,
} from "@commerceflow/types";

export interface PerformanceDiagnosticsServiceDependencies {
  readonly slowThresholdMs?: number;
  readonly maxSamples?: number;
  readonly maxSlowOperations?: number;
  readonly now?: () => number;
}

interface TimingSample {
  readonly operation: string;
  readonly durationMs: number;
  readonly recordedAtMs: number;
}

export class PerformanceDiagnosticsService {
  private readonly samples: TimingSample[] = [];
  private readonly slowOperations: SlowOperationReport[] = [];
  private readonly slowThresholdMs: number;
  private readonly maxSamples: number;
  private readonly maxSlowOperations: number;
  private readonly now: () => number;

  constructor(dependencies: PerformanceDiagnosticsServiceDependencies = {}) {
    this.slowThresholdMs = dependencies.slowThresholdMs ?? 500;
    this.maxSamples = dependencies.maxSamples ?? 1_000;
    this.maxSlowOperations = dependencies.maxSlowOperations ?? 50;
    this.now = dependencies.now ?? Date.now;
  }

  recordTiming(operation: string, durationMs: number): void {
    const recordedAtMs = this.now();
    this.samples.push({
      operation,
      durationMs,
      recordedAtMs,
    });

    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }

    if (durationMs >= this.slowThresholdMs) {
      this.slowOperations.unshift({
        operation,
        durationMs,
        recordedAt: new Date(recordedAtMs).toISOString(),
      });

      if (this.slowOperations.length > this.maxSlowOperations) {
        this.slowOperations.length = this.maxSlowOperations;
      }
    }
  }

  getDiagnostics(): PerformanceDiagnostics {
    const byOperation = new Map<string, number[]>();

    for (const sample of this.samples) {
      const existing = byOperation.get(sample.operation) ?? [];
      existing.push(sample.durationMs);
      byOperation.set(sample.operation, existing);
    }

    const timings: PerformanceTimingSummary[] = [...byOperation.entries()]
      .map(([operation, durations]) => {
        const total = durations.reduce((sum, value) => sum + value, 0);
        return {
          operation,
          count: durations.length,
          averageMs: Number((total / durations.length).toFixed(2)),
          minMs: Math.min(...durations),
          maxMs: Math.max(...durations),
        };
      })
      .sort((left, right) => left.operation.localeCompare(right.operation));

    return {
      timings,
      slowOperations: [...this.slowOperations],
      slowThresholdMs: this.slowThresholdMs,
      checkedAt: new Date(this.now()).toISOString(),
    };
  }
}

export const performanceDiagnosticsService =
  new PerformanceDiagnosticsService();
