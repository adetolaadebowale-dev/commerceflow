import type {
  DatabaseDiagnostics,
  IndexSummary,
  QueryPerformanceSummary,
} from "@commerceflow/types";

import {
  DatabaseDiagnosticsService,
  databaseDiagnosticsService,
} from "./database-diagnostics.service";
import {
  IndexReviewService,
  indexReviewService,
} from "./index-review.service";
import {
  QueryPerformanceService,
  queryPerformanceService,
} from "./query-performance.service";

export interface DatabaseOptimizationFacadeDependencies {
  readonly databaseDiagnosticsService?: DatabaseDiagnosticsService;
  readonly indexReviewService?: IndexReviewService;
  readonly queryPerformanceService?: QueryPerformanceService;
}

export class DatabaseOptimizationFacade {
  private readonly databaseDiagnosticsService: DatabaseDiagnosticsService;
  private readonly indexReviewService: IndexReviewService;
  private readonly queryPerformanceService: QueryPerformanceService;

  constructor(dependencies: DatabaseOptimizationFacadeDependencies = {}) {
    this.databaseDiagnosticsService =
      dependencies.databaseDiagnosticsService ?? databaseDiagnosticsService;
    this.indexReviewService =
      dependencies.indexReviewService ?? indexReviewService;
    this.queryPerformanceService =
      dependencies.queryPerformanceService ?? queryPerformanceService;
  }

  getDatabaseSummary(): Promise<DatabaseDiagnostics> {
    return this.databaseDiagnosticsService.getDiagnostics();
  }

  getIndexSummary(): IndexSummary {
    return this.indexReviewService.getIndexSummary();
  }

  getDiagnostics(): Promise<DatabaseDiagnostics> {
    return this.databaseDiagnosticsService.getDiagnostics();
  }

  getQueryPerformanceSummary(): QueryPerformanceSummary {
    return this.queryPerformanceService.getSummary();
  }

  recordQuery(queryKey: string, durationMs: number): void {
    this.queryPerformanceService.recordQuery(queryKey, durationMs);
  }
}

export const databaseOptimizationFacade = new DatabaseOptimizationFacade();
