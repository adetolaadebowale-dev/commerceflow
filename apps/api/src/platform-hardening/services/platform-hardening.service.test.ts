import { describe, expect, it } from "vitest";

import { PLATFORM_HARDENING_ERROR_CODES } from "../errors";
import {
  createMemoryPlatformHardeningModule,
  TEST_STORE_A_ID,
} from "../testing/platform-hardening-test-utils";

describe("PlatformHardeningFacade", () => {
  it("returns security diagnostics with configuration checks", () => {
    const module = createMemoryPlatformHardeningModule();

    const security = module.platformHardeningFacade.getSecurityDiagnostics();

    expect(security.status).toBe("secure");
    expect(security.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        "AUTH_JWT_SECRET",
        "DATABASE_URL",
        "rate_limits",
      ]),
    );
  });

  it("flags missing security configuration", () => {
    const module = createMemoryPlatformHardeningModule({
      env: { NODE_ENV: "production" },
    });

    const security = module.securityReviewService.getSecurityDiagnostics();

    expect(security.status).toBe("at_risk");
    expect(security.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "AUTH_JWT_SECRET",
          status: "fail",
        }),
      ]),
    );
  });

  it("enforces in-memory rate limits", () => {
    let current = 1_000;
    const module = createMemoryPlatformHardeningModule({
      now: () => current,
    });

    for (let index = 0; index < 20; index += 1) {
      expect(
        module.rateLimitService.consume("auth.login", "client-a").allowed,
      ).toBe(true);
    }

    expect(
      module.rateLimitService.consume("auth.login", "client-a").allowed,
    ).toBe(false);

    expect(() =>
      module.rateLimitService.assertAllowed("auth.login", "client-a"),
    ).toThrow(
      expect.objectContaining({
        code: PLATFORM_HARDENING_ERROR_CODES.RATE_LIMITED,
        status: 429,
      }),
    );

    expect(
      module.rateLimitService.consume("auth.login", "client-b").allowed,
    ).toBe(true);

    current += 60_001;
    expect(
      module.rateLimitService.consume("auth.login", "client-a").allowed,
    ).toBe(true);
  });

  it("lists and updates cache policies", async () => {
    const module = createMemoryPlatformHardeningModule();

    const listed = await module.platformHardeningFacade.listCachePolicies();
    expect(listed.length).toBeGreaterThan(0);

    const updated = await module.platformHardeningFacade.updateCachePolicy({
      storeId: TEST_STORE_A_ID,
      resource: "catalogue.products",
      enabled: false,
      ttlSeconds: 120,
      description: "Temporarily disabled",
    });

    expect(updated).toMatchObject({
      resource: "catalogue.products",
      enabled: false,
      ttlSeconds: 120,
      description: "Temporarily disabled",
    });

    const after = await module.platformHardeningFacade.listCachePolicies();
    expect(
      after.find((policy) => policy.resource === "catalogue.products"),
    ).toMatchObject({
      enabled: false,
      ttlSeconds: 120,
    });
  });

  it("records performance timings and slow operations", () => {
    const module = createMemoryPlatformHardeningModule();

    module.platformHardeningFacade.recordTiming("orders.list", 40);
    module.platformHardeningFacade.recordTiming("orders.list", 80);
    module.platformHardeningFacade.recordTiming("orders.list", 160);

    const performance =
      module.platformHardeningFacade.getPerformanceDiagnostics();

    expect(performance.slowThresholdMs).toBe(100);
    expect(performance.timings).toEqual([
      expect.objectContaining({
        operation: "orders.list",
        count: 3,
        minMs: 40,
        maxMs: 160,
        averageMs: 93.33,
      }),
    ]);
    expect(performance.slowOperations).toEqual([
      expect.objectContaining({
        operation: "orders.list",
        durationMs: 160,
      }),
    ]);
  });

  it("returns rate limit summary for operators", () => {
    const module = createMemoryPlatformHardeningModule();
    module.rateLimitService.consume("auth.login", "anonymous");

    const summary = module.platformHardeningFacade.getRateLimitSummary();

    expect(summary.policies.length).toBeGreaterThan(0);
    expect(summary.buckets.find((bucket) => bucket.key === "auth.login")).toEqual(
      expect.objectContaining({
        key: "auth.login",
        remaining: 19,
      }),
    );
  });
});
