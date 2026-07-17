import { DatabaseDiagnosticsService } from "../services/database-diagnostics.service";
import { DatabaseOptimizationFacade } from "../services/database-optimization.facade";
import { IndexReviewService } from "../services/index-review.service";
import { QueryPerformanceService } from "../services/query-performance.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export const TEST_MIGRATIONS = [
  "20250717150000_feature_flags_foundation",
  "20250717160000_platform_operations_foundation",
  "20250717170000_platform_hardening_cache_policies",
] as const;

export function createMemoryDatabaseOptimizationModule(options: {
  pingResult?: boolean;
  migrations?: readonly string[];
  slowThresholdMs?: number;
} = {}) {
  const indexReviewService = new IndexReviewService();
  const queryPerformanceService = new QueryPerformanceService({
    slowThresholdMs: options.slowThresholdMs ?? 100,
  });
  const databaseDiagnosticsService = new DatabaseDiagnosticsService({
    indexReviewService,
    queryPerformanceService,
    ping: async () => options.pingResult ?? true,
    listMigrations: () => [...(options.migrations ?? TEST_MIGRATIONS)],
  });

  return {
    indexReviewService,
    queryPerformanceService,
    databaseDiagnosticsService,
    databaseOptimizationFacade: new DatabaseOptimizationFacade({
      databaseDiagnosticsService,
      indexReviewService,
      queryPerformanceService,
    }),
  };
}
