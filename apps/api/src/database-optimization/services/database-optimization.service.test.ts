import { describe, expect, it } from "vitest";

import {
  createMemoryDatabaseOptimizationModule,
  TEST_MIGRATIONS,
} from "../testing/database-optimization-test-utils";

describe("DatabaseOptimizationFacade", () => {
  it("returns an index inventory summary", () => {
    const module = createMemoryDatabaseOptimizationModule();

    const indexes = module.databaseOptimizationFacade.getIndexSummary();

    expect(indexes.total).toBeGreaterThan(0);
    expect(indexes.indexes[0]).toEqual(
      expect.objectContaining({
        table: expect.any(String),
        name: expect.any(String),
        columns: expect.any(Array),
        unique: expect.any(Boolean),
      }),
    );
    expect(indexes.byTable.products).toBeGreaterThan(0);
  });

  it("records slow queries and emits recommendations", () => {
    const module = createMemoryDatabaseOptimizationModule({
      slowThresholdMs: 50,
    });

    module.databaseOptimizationFacade.recordQuery("orders.list", 20);
    module.databaseOptimizationFacade.recordQuery("orders.list", 80);
    module.databaseOptimizationFacade.recordQuery("orders.list", 90);

    const summary =
      module.databaseOptimizationFacade.getQueryPerformanceSummary();

    expect(summary.sampleCount).toBe(3);
    expect(summary.slowSamples).toHaveLength(2);
    expect(summary.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "slow-query:orders.list",
          severity: "warn",
        }),
        expect.objectContaining({
          code: "tenant-store-id-filter",
        }),
      ]),
    );
  });

  it("builds database diagnostics with migration consistency", async () => {
    const module = createMemoryDatabaseOptimizationModule();

    const diagnostics = await module.databaseOptimizationFacade.getDiagnostics();

    expect(diagnostics.status).toBe("healthy");
    expect(diagnostics.databaseReachable).toBe(true);
    expect(diagnostics.migrations).toEqual({
      consistent: true,
      migrationCount: TEST_MIGRATIONS.length,
      issues: [],
    });
    expect(diagnostics.indexes.total).toBeGreaterThan(0);
  });

  it("marks diagnostics degraded when migrations are inconsistent", async () => {
    const module = createMemoryDatabaseOptimizationModule({
      migrations: ["bad-migration-name"],
    });

    const diagnostics = await module.databaseOptimizationFacade.getDiagnostics();

    expect(diagnostics.status).toBe("degraded");
    expect(diagnostics.migrations.consistent).toBe(false);
    expect(diagnostics.migrations.issues.length).toBeGreaterThan(0);
  });

  it("marks diagnostics unhealthy when the database is unreachable", async () => {
    const module = createMemoryDatabaseOptimizationModule({
      pingResult: false,
    });

    const diagnostics =
      await module.databaseOptimizationFacade.getDatabaseSummary();

    expect(diagnostics.status).toBe("unhealthy");
    expect(diagnostics.databaseReachable).toBe(false);
  });
});
