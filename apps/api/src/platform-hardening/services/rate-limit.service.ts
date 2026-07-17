import type {
  RateLimitBucketStatus,
  RateLimitPolicy,
  RateLimitSummary,
} from "@commerceflow/types";

import {
  PLATFORM_HARDENING_ERROR_CODES,
  PlatformHardeningError,
} from "../errors";

export const DEFAULT_RATE_LIMIT_POLICIES: readonly RateLimitPolicy[] = [
  {
    key: "auth.login",
    limit: 20,
    windowMs: 60_000,
    enabled: true,
    description: "Login attempts per client identity",
  },
  {
    key: "auth.register",
    limit: 10,
    windowMs: 60_000,
    enabled: true,
    description: "Registration attempts per client identity",
  },
  {
    key: "platform.diagnostics",
    limit: 60,
    windowMs: 60_000,
    enabled: true,
    description: "Platform diagnostics reads",
  },
];

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: string;
  readonly limit: number;
  readonly windowMs: number;
}

export interface RateLimitServiceDependencies {
  readonly policies?: readonly RateLimitPolicy[];
  readonly now?: () => number;
}

export class RateLimitService {
  private readonly policiesByKey: Map<string, RateLimitPolicy>;
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly now: () => number;

  constructor(dependencies: RateLimitServiceDependencies = {}) {
    this.policiesByKey = new Map(
      (dependencies.policies ?? DEFAULT_RATE_LIMIT_POLICIES).map((policy) => [
        policy.key,
        policy,
      ]),
    );
    this.now = dependencies.now ?? Date.now;
  }

  listPolicies(): readonly RateLimitPolicy[] {
    return [...this.policiesByKey.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }

  consume(key: string, identity = "anonymous"): RateLimitDecision {
    const policy = this.policiesByKey.get(key);

    if (!policy) {
      throw new PlatformHardeningError(
        PLATFORM_HARDENING_ERROR_CODES.NOT_FOUND,
        `Rate limit policy not found: ${key}`,
        404,
      );
    }

    if (!policy.enabled) {
      return {
        allowed: true,
        remaining: policy.limit,
        resetAt: new Date(this.now() + policy.windowMs).toISOString(),
        limit: policy.limit,
        windowMs: policy.windowMs,
      };
    }

    const bucketKey = `${key}:${identity}`;
    const currentMs = this.now();
    let bucket = this.buckets.get(bucketKey);

    if (!bucket || bucket.resetAtMs <= currentMs) {
      bucket = {
        count: 0,
        resetAtMs: currentMs + policy.windowMs,
      };
    }

    if (bucket.count >= policy.limit) {
      this.buckets.set(bucketKey, bucket);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(bucket.resetAtMs).toISOString(),
        limit: policy.limit,
        windowMs: policy.windowMs,
      };
    }

    bucket = {
      ...bucket,
      count: bucket.count + 1,
    };
    this.buckets.set(bucketKey, bucket);

    return {
      allowed: true,
      remaining: Math.max(policy.limit - bucket.count, 0),
      resetAt: new Date(bucket.resetAtMs).toISOString(),
      limit: policy.limit,
      windowMs: policy.windowMs,
    };
  }

  assertAllowed(key: string, identity = "anonymous"): RateLimitDecision {
    const decision = this.consume(key, identity);

    if (!decision.allowed) {
      throw new PlatformHardeningError(
        PLATFORM_HARDENING_ERROR_CODES.RATE_LIMITED,
        `Rate limit exceeded for ${key}`,
        429,
        decision,
      );
    }

    return decision;
  }

  getSummary(): RateLimitSummary {
    const policies = this.listPolicies();
    const buckets: RateLimitBucketStatus[] = policies.map((policy) => {
      const bucketKey = `${policy.key}:anonymous`;
      const bucket = this.buckets.get(bucketKey);
      const currentMs = this.now();
      const active =
        bucket && bucket.resetAtMs > currentMs
          ? bucket
          : {
              count: 0,
              resetAtMs: currentMs + policy.windowMs,
            };

      return {
        key: policy.key,
        limit: policy.limit,
        windowMs: policy.windowMs,
        remaining: Math.max(policy.limit - active.count, 0),
        resetAt: new Date(active.resetAtMs).toISOString(),
        enabled: policy.enabled,
      };
    });

    return {
      policies,
      buckets,
      checkedAt: new Date(this.now()).toISOString(),
    };
  }
}

export const rateLimitService = new RateLimitService();
