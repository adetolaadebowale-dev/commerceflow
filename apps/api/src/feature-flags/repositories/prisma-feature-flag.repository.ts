import {
  Prisma,
  type FeatureFlag as PrismaFeatureFlag,
  type PrismaClient,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type FeatureFlag,
  type FeatureFlagScope,
} from "@commerceflow/types";
import type {
  ListFeatureFlagsQuery,
  UpsertFeatureFlagInput,
} from "@commerceflow/validation";

import { FEATURE_FLAG_ERROR_CODES, FeatureFlagError } from "../errors";
import type {
  FeatureFlagRepository,
  FeatureFlagStoreContext,
} from "./feature-flag.repository";
import { buildScopeIdentity } from "./feature-flag.repository";

function toFeatureFlag(record: PrismaFeatureFlag): FeatureFlag {
  return {
    id: record.id,
    organizationId: record.organizationId ?? undefined,
    storeId: record.storeId ?? undefined,
    key: record.key,
    enabled: record.enabled,
    scope: record.scope,
    description: record.description ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildScopeWhere(
  scope: FeatureFlagScope,
  context: FeatureFlagStoreContext,
): Prisma.FeatureFlagWhereInput {
  switch (scope) {
    case "platform":
      return { scope: "platform", organizationId: null, storeId: null };
    case "organization":
      return {
        scope: "organization",
        organizationId: context.organizationId,
        storeId: null,
      };
    case "store":
      return {
        scope: "store",
        storeId: context.storeId,
        organizationId: context.organizationId,
      };
  }
}

export class PrismaFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly db: PrismaClient) {}

  async resolveStoreContext(
    storeId: string,
  ): Promise<FeatureFlagStoreContext | null> {
    const store = await this.db.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true, organizationId: true },
    });

    if (!store) {
      return null;
    }

    return {
      storeId: store.id,
      organizationId: store.organizationId,
    };
  }

  async listFlagsForStoreContext(
    context: FeatureFlagStoreContext,
    query: ListFeatureFlagsQuery,
  ) {
    const where: Prisma.FeatureFlagWhereInput = {
      OR: [
        { scope: "platform" },
        {
          scope: "organization",
          organizationId: context.organizationId,
        },
        {
          scope: "store",
          storeId: context.storeId,
        },
      ],
    };

    const [records, total] = await Promise.all([
      this.db.featureFlag.findMany({
        where,
        orderBy: [{ key: "asc" }, { scope: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.db.featureFlag.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toFeatureFlag),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async findFlagsForEffectiveResolution(
    context: FeatureFlagStoreContext,
    keys?: readonly string[],
  ): Promise<readonly FeatureFlag[]> {
    const where: Prisma.FeatureFlagWhereInput = {
      OR: [
        { scope: "platform" },
        {
          scope: "organization",
          organizationId: context.organizationId,
        },
        {
          scope: "store",
          storeId: context.storeId,
        },
      ],
      ...(keys && keys.length > 0 ? { key: { in: [...keys] } } : {}),
    };

    const records = await this.db.featureFlag.findMany({ where });
    return records.map(toFeatureFlag);
  }

  async findByScopeAndKey(
    scope: FeatureFlagScope,
    key: string,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag | null> {
    const record = await this.db.featureFlag.findFirst({
      where: {
        ...buildScopeWhere(scope, context),
        key,
      },
    });

    return record ? toFeatureFlag(record) : null;
  }

  async upsertFlag(
    key: string,
    input: UpsertFeatureFlagInput,
    context: FeatureFlagStoreContext,
  ): Promise<FeatureFlag> {
    const scope = input.scope;
    const where = buildScopeWhere(scope, context);
    const existing = await this.db.featureFlag.findFirst({
      where: { ...where, key },
    });

    try {
      const record = existing
        ? await this.db.featureFlag.update({
            where: { id: existing.id },
            data: {
              enabled: input.enabled,
              description: input.description ?? null,
            },
          })
        : await this.db.featureFlag.create({
            data: {
              key,
              enabled: input.enabled,
              scope,
              description: input.description ?? null,
              organizationId:
                scope === "organization" || scope === "store"
                  ? context.organizationId
                  : null,
              storeId: scope === "store" ? context.storeId : null,
            },
          });

      return toFeatureFlag(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new FeatureFlagError(
          FEATURE_FLAG_ERROR_CODES.DUPLICATE_KEY,
          `Feature flag already exists for ${buildScopeIdentity(scope, context)} and key ${key}`,
          409,
        );
      }

      throw error;
    }
  }
}
