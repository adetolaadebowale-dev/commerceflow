import type { IndexSummary } from "@commerceflow/types";

import { INDEX_CATALOG } from "../catalog/index-catalog";

export interface IndexReviewServiceDependencies {
  readonly indexes?: typeof INDEX_CATALOG;
  readonly now?: () => Date;
}

export class IndexReviewService {
  private readonly indexes: typeof INDEX_CATALOG;
  private readonly now: () => Date;

  constructor(dependencies: IndexReviewServiceDependencies = {}) {
    this.indexes = dependencies.indexes ?? INDEX_CATALOG;
    this.now = dependencies.now ?? (() => new Date());
  }

  getIndexSummary(): IndexSummary {
    const byTable: Record<string, number> = {};

    for (const index of this.indexes) {
      byTable[index.table] = (byTable[index.table] ?? 0) + 1;
    }

    return {
      total: this.indexes.length,
      byTable,
      indexes: [...this.indexes].sort(
        (left, right) =>
          left.table.localeCompare(right.table) ||
          left.name.localeCompare(right.name),
      ),
      checkedAt: this.now().toISOString(),
    };
  }
}

export const indexReviewService = new IndexReviewService();
