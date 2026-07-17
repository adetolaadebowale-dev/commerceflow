import type {
  QueryPerformanceRecommendation,
  QueryPerformanceSummary,
  SlowQuerySample,
} from "@commerceflow/types";

import { BASELINE_QUERY_RECOMMENDATIONS } from "../catalog/index-catalog";

export interface QueryPerformanceServiceDependencies {
  readonly slowThresholdMs?: number;
  readonly maxSlowSamples?: number;
  readonly now?: () => number;
}

export class QueryPerformanceService {
  private readonly slowSamples: SlowQuerySample[] = [];
  private sampleCount = 0;
  private readonly slowThresholdMs: number;
  private readonly maxSlowSamples: number;
  private readonly now: () => number;

  constructor(dependencies: QueryPerformanceServiceDependencies = {}) {
    this.slowThresholdMs = dependencies.slowThresholdMs ?? 200;
    this.maxSlowSamples = dependencies.maxSlowSamples ?? 50;
    this.now = dependencies.now ?? Date.now;
  }

  recordQuery(queryKey: string, durationMs: number): void {
    this.sampleCount += 1;

    if (durationMs < this.slowThresholdMs) {
      return;
    }

    this.slowSamples.unshift({
      queryKey,
      durationMs,
      recordedAt: new Date(this.now()).toISOString(),
    });

    if (this.slowSamples.length > this.maxSlowSamples) {
      this.slowSamples.length = this.maxSlowSamples;
    }
  }

  getSummary(): QueryPerformanceSummary {
    return {
      sampleCount: this.sampleCount,
      slowSamples: [...this.slowSamples],
      recommendations: this.buildRecommendations(),
      slowThresholdMs: this.slowThresholdMs,
      checkedAt: new Date(this.now()).toISOString(),
    };
  }

  private buildRecommendations(): QueryPerformanceRecommendation[] {
    const recommendations: QueryPerformanceRecommendation[] = [
      ...BASELINE_QUERY_RECOMMENDATIONS,
    ];

    const slowByKey = new Map<string, number>();
    for (const sample of this.slowSamples) {
      slowByKey.set(
        sample.queryKey,
        (slowByKey.get(sample.queryKey) ?? 0) + 1,
      );
    }

    for (const [queryKey, count] of slowByKey) {
      if (count >= 2) {
        recommendations.push({
          code: `slow-query:${queryKey}`,
          severity: "warn",
          message: `Query "${queryKey}" exceeded the slow threshold ${count} times in development diagnostics`,
        });
      }
    }

    return recommendations;
  }
}

export const queryPerformanceService = new QueryPerformanceService();
