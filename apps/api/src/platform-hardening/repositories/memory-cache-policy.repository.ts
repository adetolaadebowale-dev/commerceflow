import type { CachePolicy } from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

import {
  DEFAULT_CACHE_POLICIES,
  type CachePolicyRepository,
} from "./cache-policy.repository";

function seedDefaults(): Map<string, CachePolicy> {
  const now = new Date(0).toISOString();
  const policies = new Map<string, CachePolicy>();

  for (const policy of DEFAULT_CACHE_POLICIES) {
    policies.set(policy.resource, {
      ...policy,
      updatedAt: now,
    });
  }

  return policies;
}

export class MemoryCachePolicyRepository implements CachePolicyRepository {
  private readonly policiesByResource = seedDefaults();

  seedPolicy(policy: CachePolicy): void {
    this.policiesByResource.set(policy.resource, policy);
  }

  async listPolicies(): Promise<readonly CachePolicy[]> {
    return [...this.policiesByResource.values()].sort((left, right) =>
      left.resource.localeCompare(right.resource),
    );
  }

  async upsertPolicy(
    input: Omit<UpdateCachePolicyInput, "storeId">,
  ): Promise<CachePolicy> {
    const existing = this.policiesByResource.get(input.resource);
    const policy: CachePolicy = {
      resource: input.resource,
      enabled: input.enabled,
      ttlSeconds: input.ttlSeconds,
      description: input.description ?? existing?.description,
      updatedAt: new Date().toISOString(),
    };

    this.policiesByResource.set(input.resource, policy);
    return policy;
  }
}
