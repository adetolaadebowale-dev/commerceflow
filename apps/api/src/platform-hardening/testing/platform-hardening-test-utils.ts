import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCachePolicyRepository } from "../repositories/memory-cache-policy.repository";
import { CachePolicyService } from "../services/cache-policy.service";
import { PerformanceDiagnosticsService } from "../services/performance-diagnostics.service";
import { PlatformHardeningFacade } from "../services/platform-hardening.facade";
import { RateLimitService } from "../services/rate-limit.service";
import { SecurityReviewService } from "../services/security-review.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";

export function createMemoryPlatformHardeningModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
} = {}) {
  const cachePolicyRepository = new MemoryCachePolicyRepository();
  const rateLimitService = new RateLimitService({ now: options.now });
  const performanceDiagnosticsService = new PerformanceDiagnosticsService({
    now: options.now,
    slowThresholdMs: 100,
  });
  const securityReviewService = new SecurityReviewService({
    rateLimitService,
    environment: options.env?.NODE_ENV,
    env: options.env ?? {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/commerceflow",
      AUTH_JWT_SECRET: "test-auth-jwt-secret-value-32b",
    },
  });
  const cachePolicyService = new CachePolicyService({
    cachePolicyRepository,
    domainEventPublisher: options.domainEventPublisher,
  });

  return {
    cachePolicyRepository,
    rateLimitService,
    performanceDiagnosticsService,
    securityReviewService,
    cachePolicyService,
    platformHardeningFacade: new PlatformHardeningFacade({
      securityReviewService,
      rateLimitService,
      cachePolicyService,
      performanceDiagnosticsService,
    }),
  };
}
