import {
  buildCatalogueListResult,
  type FeatureFlag,
  type FeatureFlagScope,
} from "@commerceflow/types";
import type {
  ListFeatureFlagsQuery,
  UpsertFeatureFlagInput,
} from "@commerceflow/validation";

import type {
  FeatureFlagRepository,
  FeatureFlagStoreContext,
} from "./feature-flag.repository";
import { buildScopeIdentity } from "./feature-flag.repository";

export class MemoryFeatureFlagRepository implements FeatureFlagRepository {
  private readonly storesById = new Map<string, FeatureFlagStoreContext>();
  private readonly flagsByIdentity = new Map<string, FeatureFlag>();

  seedStore(context: FeatureFlagStoreContext): void {
    this.storesById.set(context.storeId, context);
  }

  async resolveStoreContext(
    storeId: string,
  ): Promise<FeatureFlagStoreContext | null> {
    return this.storesById.get(storeId) ?? null;
  }

  async listFlagsForStoreContext(
    context: FeatureFlagStoreContext,
    query: ListFeatureFlagsQuery,
  ) {
    const items = [...this.flagsByIdentity.values()]
      .filter((flag) => this.isVisibleToStore(flag, context))
      .sort(
        (left, right) =>
          left.key.localeCompare(right.key) ||
          left.scope.localeCompare(right.scope),
      );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async findFlagsForEffectiveResolution(
    context: FeatureFlagStoreContext,
    keys?: readonly string[],
  ): Promise<readonly FeatureFlag[]> {
    return [...this.flagsByIdentity.values()].filter(
      (flag) =>
        this.isVisibleToStore(flag, context) &&
        (keys === undefined || keys.length === 0 || keys.includes(flag.key)),
    );
  }

  async findByScopeAndKey(
    scope: FeatureFlagScope,
    key: string,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag | null> {
    const identity = `${buildScopeIdentity(scope, context)}:${key}`;
    return this.flagsByIdentity.get(identity) ?? null;
  }

  async upsertFlag(
    key: string,
    input: UpsertFeatureFlagInput,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag> {
    const scope = input.scope;
    const identity = `${buildScopeIdentity(scope, context)}:${key}`;
    const existing = this.flagsByIdentity.get(identity);
    const now = new Date().toISOString();

    const flag: FeatureFlag = {
      id: existing?.id ?? crypto.randomUUID(),
      organizationId:
        scope === "organization"
          ? context.organizationId
          : scope === "store"
            ? context.organizationId
            : undefined,
      storeId: scope === "store" ? context.storeId : undefined,
      key,
      enabled: input.enabled,
      scope,
      description: input.description,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.flagsByIdentity.set(identity, flag);
    return flag;
  }

  private isVisibleToStore(
    flag: FeatureFlag,
    context: FeatureFlagStoreContext,
  ): boolean {
    switch (flag.scope) {
      case "platform":
        return true;
      case "organization":
        return flag.organizationId === context.organizationId;
      case "store":
        return flag.storeId === context.storeId;
    }
  }
}
