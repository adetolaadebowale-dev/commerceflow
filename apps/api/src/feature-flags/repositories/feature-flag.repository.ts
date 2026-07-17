import type {
  EffectiveFeatureFlag,
  FeatureFlag,
  FeatureFlagScope,
} from "@commerceflow/types";
import type {
  ListFeatureFlagsQuery,
  UpsertFeatureFlagInput,
} from "@commerceflow/validation";

export interface FeatureFlagStoreContext {
  readonly storeId: string;
  readonly organizationId: string;
}

export interface FeatureFlagRepository {
  resolveStoreContext(storeId: string): Promise<FeatureFlagStoreContext | null>;
  listFlagsForStoreContext(
    context: FeatureFlagStoreContext,
    query: ListFeatureFlagsQuery,
  ): Promise<{
    items: readonly FeatureFlag[];
    total: number;
    page: number;
    limit: number;
  }>;
  findFlagsForEffectiveResolution(
    context: FeatureFlagStoreContext,
    keys?: readonly string[],
  ): Promise<readonly FeatureFlag[]>;
  findByScopeAndKey(
    scope: FeatureFlagScope,
    key: string,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag | null>;
  upsertFlag(
    key: string,
    input: UpsertFeatureFlagInput,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag>;
}

export function buildScopeIdentity(
  scope: FeatureFlagScope,
  context: FeatureFlagStoreContext,
): string {
  switch (scope) {
    case "platform":
      return "platform";
    case "organization":
      return `organization:${context.organizationId}`;
    case "store":
      return `store:${context.storeId}`;
  }
}

export function resolveEffectiveFlags(
  flags: readonly FeatureFlag[],
  keys: readonly string[],
): EffectiveFeatureFlag[] {
  const flagsByKey = new Map<string, FeatureFlag[]>();

  for (const flag of flags) {
    const existing = flagsByKey.get(flag.key) ?? [];
    existing.push(flag);
    flagsByKey.set(flag.key, existing);
  }

  return keys.map((key) => resolveEffectiveFlag(key, flagsByKey.get(key) ?? []));
}

export function resolveEffectiveFlag(
  key: string,
  flags: readonly FeatureFlag[],
): EffectiveFeatureFlag {
  const storeFlag = flags.find((flag) => flag.scope === "store");
  if (storeFlag) {
    return {
      key,
      enabled: storeFlag.enabled,
      source: "store",
      flag: storeFlag,
    };
  }

  const organizationFlag = flags.find((flag) => flag.scope === "organization");
  if (organizationFlag) {
    return {
      key,
      enabled: organizationFlag.enabled,
      source: "organization",
      flag: organizationFlag,
    };
  }

  const platformFlag = flags.find((flag) => flag.scope === "platform");
  if (platformFlag) {
    return {
      key,
      enabled: platformFlag.enabled,
      source: "platform",
      flag: platformFlag,
    };
  }

  return {
    key,
    enabled: false,
    source: "default",
  };
}

export function collectKnownKeys(flags: readonly FeatureFlag[]): string[] {
  return [...new Set(flags.map((flag) => flag.key))].sort();
}
