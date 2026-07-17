/** Feature flag scope levels ordered from lowest to highest precedence. */
export const FEATURE_FLAG_SCOPES = [
  "platform",
  "organization",
  "store",
] as const;

export type FeatureFlagScope = (typeof FEATURE_FLAG_SCOPES)[number];

/** Source of an effective feature flag value after precedence resolution. */
export const EFFECTIVE_FEATURE_FLAG_SOURCES = [
  "default",
  ...FEATURE_FLAG_SCOPES,
] as const;

export type EffectiveFeatureFlagSource =
  (typeof EFFECTIVE_FEATURE_FLAG_SOURCES)[number];

/** Configured feature flag record. */
export interface FeatureFlag {
  readonly id: string;
  readonly organizationId?: string;
  readonly storeId?: string;
  readonly key: string;
  readonly enabled: boolean;
  readonly scope: FeatureFlagScope;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Resolved feature flag value for a store context. */
export interface EffectiveFeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
  readonly source: EffectiveFeatureFlagSource;
  readonly flag?: FeatureFlag;
}
