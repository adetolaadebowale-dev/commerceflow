import {
  Prisma,
  type PlatformConfiguration as PrismaPlatformConfiguration,
  type PrismaClient,
} from "@prisma/client";
import type { CachePolicy } from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

import {
  DEFAULT_CACHE_POLICIES,
  type CachePolicyRepository,
} from "./cache-policy.repository";

function parsePolicies(value: Prisma.JsonValue): CachePolicy[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      typeof item.resource !== "string" ||
      typeof item.enabled !== "boolean" ||
      typeof item.ttlSeconds !== "number" ||
      typeof item.updatedAt !== "string"
    ) {
      return [];
    }

    return [
      {
        resource: item.resource,
        enabled: item.enabled,
        ttlSeconds: item.ttlSeconds,
        description:
          typeof item.description === "string" ? item.description : undefined,
        updatedAt: item.updatedAt,
      },
    ];
  });
}

function toJson(policies: readonly CachePolicy[]): Prisma.InputJsonValue {
  return policies as unknown as Prisma.InputJsonValue;
}

export class PrismaCachePolicyRepository implements CachePolicyRepository {
  constructor(private readonly db: PrismaClient) {}

  async listPolicies(): Promise<readonly CachePolicy[]> {
    const configuration = await this.ensureConfiguration();
    return parsePolicies(configuration.cachePolicies).sort((left, right) =>
      left.resource.localeCompare(right.resource),
    );
  }

  async upsertPolicy(
    input: Omit<UpdateCachePolicyInput, "storeId">,
  ): Promise<CachePolicy> {
    const configuration = await this.ensureConfiguration();
    const policies = parsePolicies(configuration.cachePolicies);
    const existing = policies.find(
      (policy) => policy.resource === input.resource,
    );
    const updated: CachePolicy = {
      resource: input.resource,
      enabled: input.enabled,
      ttlSeconds: input.ttlSeconds,
      description: input.description ?? existing?.description,
      updatedAt: new Date().toISOString(),
    };

    const nextPolicies = existing
      ? policies.map((policy) =>
          policy.resource === input.resource ? updated : policy,
        )
      : [...policies, updated];

    await this.db.platformConfiguration.update({
      where: { id: configuration.id },
      data: {
        cachePolicies: toJson(nextPolicies),
      },
    });

    return updated;
  }

  private async ensureConfiguration(): Promise<PrismaPlatformConfiguration> {
    const existing = await this.db.platformConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      const policies = parsePolicies(existing.cachePolicies);
      if (policies.length > 0) {
        return existing;
      }

      const seeded = await this.db.platformConfiguration.update({
        where: { id: existing.id },
        data: {
          cachePolicies: toJson(this.defaultPolicies()),
        },
      });

      return seeded;
    }

    return this.db.platformConfiguration.create({
      data: {
        maintenanceMode: false,
        cachePolicies: toJson(this.defaultPolicies()),
      },
    });
  }

  private defaultPolicies(): CachePolicy[] {
    const now = new Date().toISOString();
    return DEFAULT_CACHE_POLICIES.map((policy) => ({
      ...policy,
      updatedAt: now,
    }));
  }
}
