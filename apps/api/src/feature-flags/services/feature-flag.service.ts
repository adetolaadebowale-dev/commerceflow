import type { EffectiveFeatureFlag, FeatureFlag } from "@commerceflow/types";
import type {
  EffectiveFeatureFlagsQuery,
  ListFeatureFlagsQuery,
  UpsertFeatureFlagInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { FEATURE_FLAG_ERROR_CODES, FeatureFlagError } from "../errors";
import {
  collectKnownKeys,
  getFeatureFlagRepository,
  resolveEffectiveFlags,
  type FeatureFlagRepository,
} from "../repositories";

export interface FeatureFlagServiceDependencies {
  readonly featureFlagRepository?: FeatureFlagRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class FeatureFlagService {
  private readonly featureFlagRepository: FeatureFlagRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: FeatureFlagServiceDependencies = {}) {
    this.featureFlagRepository =
      dependencies.featureFlagRepository ?? getFeatureFlagRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async listFeatureFlags(query: ListFeatureFlagsQuery) {
    const context = await this.requireStoreContext(query.storeId);
    return this.featureFlagRepository.listFlagsForStoreContext(context, query);
  }

  async getEffectiveFeatureFlags(
    query: EffectiveFeatureFlagsQuery,
  ): Promise<{ items: readonly EffectiveFeatureFlag[] }> {
    const context = await this.requireStoreContext(query.storeId);
    const flags = await this.featureFlagRepository.findFlagsForEffectiveResolution(
      context,
      query.keys,
    );

    const keys =
      query.keys && query.keys.length > 0
        ? query.keys
        : collectKnownKeys(flags);

    return {
      items: resolveEffectiveFlags(flags, keys),
    };
  }

  async upsertFeatureFlag(
    key: string,
    input: UpsertFeatureFlagInput,
  ): Promise<FeatureFlag> {
    const context = await this.requireStoreContext(input.storeId);

    let featureFlag: FeatureFlag;

    try {
      featureFlag = await this.featureFlagRepository.upsertFlag(
        key,
        input,
        context,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishFeatureFlagUpdated(
      featureFlag,
      input.storeId,
    );

    return featureFlag;
  }

  private async requireStoreContext(storeId: string) {
    const context =
      await this.featureFlagRepository.resolveStoreContext(storeId);

    if (!context) {
      throw new FeatureFlagError(
        FEATURE_FLAG_ERROR_CODES.STORE_NOT_FOUND,
        "Store not found",
        404,
      );
    }

    return context;
  }

  private mapRepositoryError(error: unknown): FeatureFlagError {
    if (error instanceof FeatureFlagError) {
      return error;
    }

    return new FeatureFlagError(
      FEATURE_FLAG_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "Feature flag repository error",
      500,
    );
  }
}

export const featureFlagService = new FeatureFlagService();
