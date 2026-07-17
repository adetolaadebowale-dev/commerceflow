import { readdirSync } from "node:fs";
import { join } from "node:path";

import type {
  DatabaseDiagnosticStatus,
  DatabaseDiagnostics,
  MigrationConsistencyResult,
} from "@commerceflow/types";

import { prisma } from "@/lib/prisma";
import {
  IndexReviewService,
  indexReviewService,
} from "./index-review.service";
import {
  QueryPerformanceService,
  queryPerformanceService,
} from "./query-performance.service";

export interface DatabaseDiagnosticsServiceDependencies {
  readonly indexReviewService?: IndexReviewService;
  readonly queryPerformanceService?: QueryPerformanceService;
  readonly ping?: () => Promise<boolean>;
  readonly listMigrations?: () => string[];
  readonly migrationsDirectory?: string;
  readonly now?: () => Date;
}

const MIGRATION_NAME_PATTERN = /^\d{14}_[a-z0-9_]+$/;

export class DatabaseDiagnosticsService {
  private readonly indexReviewService: IndexReviewService;
  private readonly queryPerformanceService: QueryPerformanceService;
  private readonly ping: () => Promise<boolean>;
  private readonly listMigrations: () => string[];
  private readonly now: () => Date;

  constructor(dependencies: DatabaseDiagnosticsServiceDependencies = {}) {
    this.indexReviewService =
      dependencies.indexReviewService ?? indexReviewService;
    this.queryPerformanceService =
      dependencies.queryPerformanceService ?? queryPerformanceService;
    this.ping =
      dependencies.ping ??
      (async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        } catch {
          return false;
        }
      });
    this.listMigrations =
      dependencies.listMigrations ??
      (() =>
        this.readMigrationDirectories(
          dependencies.migrationsDirectory ??
            join(process.cwd(), "prisma", "migrations"),
        ));
    this.now = dependencies.now ?? (() => new Date());
  }

  async getDiagnostics(): Promise<DatabaseDiagnostics> {
    const [databaseReachable, indexes, queryPerformance, migrations] =
      await Promise.all([
        this.ping(),
        Promise.resolve(this.indexReviewService.getIndexSummary()),
        Promise.resolve(this.queryPerformanceService.getSummary()),
        Promise.resolve(this.validateMigrations()),
      ]);

    return {
      status: this.deriveStatus(
        databaseReachable,
        migrations,
        queryPerformance.recommendations.some(
          (recommendation) => recommendation.severity === "critical",
        ),
      ),
      databaseReachable,
      indexes,
      queryPerformance,
      migrations,
      checkedAt: this.now().toISOString(),
    };
  }

  validateMigrations(
    migrationNames = this.listMigrations(),
  ): MigrationConsistencyResult {
    const issues: string[] = [];
    const sorted = [...migrationNames].sort();

    if (migrationNames.length === 0) {
      issues.push("No migration directories were found");
    }

    for (const name of migrationNames) {
      if (!MIGRATION_NAME_PATTERN.test(name)) {
        issues.push(`Invalid migration directory name: ${name}`);
      }
    }

    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index] === sorted[index - 1]) {
        issues.push(`Duplicate migration directory: ${sorted[index]}`);
      }
    }

    const requiredSuffixes = [
      "feature_flags_foundation",
      "platform_operations_foundation",
      "platform_hardening_cache_policies",
    ];

    for (const suffix of requiredSuffixes) {
      if (!migrationNames.some((name) => name.endsWith(`_${suffix}`))) {
        issues.push(`Missing expected migration suffix: ${suffix}`);
      }
    }

    return {
      consistent: issues.length === 0,
      migrationCount: migrationNames.length,
      issues,
    };
  }

  private deriveStatus(
    databaseReachable: boolean,
    migrations: MigrationConsistencyResult,
    hasCriticalRecommendations: boolean,
  ): DatabaseDiagnosticStatus {
    if (!databaseReachable || hasCriticalRecommendations) {
      return "unhealthy";
    }

    if (!migrations.consistent) {
      return "degraded";
    }

    return "healthy";
  }

  private readMigrationDirectories(directory: string): string[] {
    try {
      return readdirSync(directory, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() && entry.name !== "migration_lock.toml",
        )
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}

export const databaseDiagnosticsService = new DatabaseDiagnosticsService();
