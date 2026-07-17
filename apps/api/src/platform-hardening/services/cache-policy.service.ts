import type { CachePolicy } from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getCachePolicyRepository,
  type CachePolicyRepository,
} from "../repositories";

export interface CachePolicyServiceDependencies {
  readonly cachePolicyRepository?: CachePolicyRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CachePolicyService {
  private readonly cachePolicyRepository: CachePolicyRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CachePolicyServiceDependencies = {}) {
    this.cachePolicyRepository =
      dependencies.cachePolicyRepository ?? getCachePolicyRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  listCachePolicies(): Promise<readonly CachePolicy[]> {
    return this.cachePolicyRepository.listPolicies();
  }

  async updateCachePolicy(input: UpdateCachePolicyInput): Promise<CachePolicy> {
    const cachePolicy = await this.cachePolicyRepository.upsertPolicy({
      resource: input.resource,
      enabled: input.enabled,
      ttlSeconds: input.ttlSeconds,
      description: input.description,
    });

    this.domainEventPublisher.publishPlatformCachePolicyUpdated(
      cachePolicy,
      input.storeId,
    );

    return cachePolicy;
  }
}

export const cachePolicyService = new CachePolicyService();
