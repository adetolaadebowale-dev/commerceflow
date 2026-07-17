import type {
  CachePolicy,
  PerformanceDiagnostics,
  RateLimitSummary,
  SecurityDiagnostics,
} from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

import {
  CachePolicyService,
  cachePolicyService,
} from "./cache-policy.service";
import {
  PerformanceDiagnosticsService,
  performanceDiagnosticsService,
} from "./performance-diagnostics.service";
import {
  RateLimitService,
  rateLimitService,
} from "./rate-limit.service";
import {
  SecurityReviewService,
  securityReviewService,
} from "./security-review.service";

export interface PlatformHardeningFacadeDependencies {
  readonly securityReviewService?: SecurityReviewService;
  readonly rateLimitService?: RateLimitService;
  readonly cachePolicyService?: CachePolicyService;
  readonly performanceDiagnosticsService?: PerformanceDiagnosticsService;
}

/** Facade exposing hardening capabilities to HTTP routes. */
export class PlatformHardeningFacade {
  private readonly securityReviewService: SecurityReviewService;
  private readonly rateLimitService: RateLimitService;
  private readonly cachePolicyService: CachePolicyService;
  private readonly performanceDiagnosticsService: PerformanceDiagnosticsService;

  constructor(dependencies: PlatformHardeningFacadeDependencies = {}) {
    this.securityReviewService =
      dependencies.securityReviewService ?? securityReviewService;
    this.rateLimitService =
      dependencies.rateLimitService ?? rateLimitService;
    this.cachePolicyService =
      dependencies.cachePolicyService ?? cachePolicyService;
    this.performanceDiagnosticsService =
      dependencies.performanceDiagnosticsService ??
      performanceDiagnosticsService;
  }

  getSecurityDiagnostics(): SecurityDiagnostics {
    return this.securityReviewService.getSecurityDiagnostics();
  }

  getPerformanceDiagnostics(): PerformanceDiagnostics {
    return this.performanceDiagnosticsService.getDiagnostics();
  }

  recordTiming(operation: string, durationMs: number): void {
    this.performanceDiagnosticsService.recordTiming(operation, durationMs);
  }

  listCachePolicies(): Promise<readonly CachePolicy[]> {
    return this.cachePolicyService.listCachePolicies();
  }

  updateCachePolicy(input: UpdateCachePolicyInput): Promise<CachePolicy> {
    return this.cachePolicyService.updateCachePolicy(input);
  }

  getRateLimitSummary(): RateLimitSummary {
    return this.rateLimitService.getSummary();
  }
}

export const platformHardeningFacade = new PlatformHardeningFacade();
