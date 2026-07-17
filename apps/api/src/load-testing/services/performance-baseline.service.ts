import type { PerformanceBaseline } from "@commerceflow/types";

import { DEFAULT_ENDPOINT_BASELINES } from "../repositories";

export interface PerformanceBaselineServiceDependencies {
  readonly baselines?: typeof DEFAULT_ENDPOINT_BASELINES;
  readonly now?: () => Date;
}

export class PerformanceBaselineService {
  private readonly baselines: typeof DEFAULT_ENDPOINT_BASELINES;
  private readonly now: () => Date;

  constructor(dependencies: PerformanceBaselineServiceDependencies = {}) {
    this.baselines = dependencies.baselines ?? DEFAULT_ENDPOINT_BASELINES;
    this.now = dependencies.now ?? (() => new Date());
  }

  getBaselines(): PerformanceBaseline {
    return {
      endpoints: [...this.baselines].sort((left, right) =>
        left.endpointKey.localeCompare(right.endpointKey),
      ),
      recordedAt: this.now().toISOString(),
    };
  }
}

export const performanceBaselineService = new PerformanceBaselineService();
