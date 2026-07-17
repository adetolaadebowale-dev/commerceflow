import {
  Prisma,
  type Organization as PrismaOrganization,
  type PrismaClient,
  type Store as PrismaStore,
} from "@prisma/client";
import type {
  Organization,
  OrganizationSettings,
  OrganizationStoreSummary,
} from "@commerceflow/types";
import type { UpdateOrganizationInput } from "@commerceflow/validation";

import type { OrganizationRepository } from "./organization.repository";

function toSettings(value: Prisma.JsonValue): OrganizationSettings {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as OrganizationSettings;
  }

  return {};
}

function toOrganization(record: PrismaOrganization): Organization {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    settings: toSettings(record.settings),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toOrganizationStoreSummary(record: PrismaStore): OrganizationStoreSummary {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    slug: record.slug,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Organization | null> {
    const record = await this.db.organization.findFirst({
      where: { id, deletedAt: null },
    });

    return record ? toOrganization(record) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const record = await this.db.organization.findFirst({
      where: { slug, deletedAt: null },
    });

    return record ? toOrganization(record) : null;
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const record = await this.db.organization.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
      },
    });

    return toOrganization(record);
  }

  async listStores(
    organizationId: string,
  ): Promise<readonly OrganizationStoreSummary[]> {
    const records = await this.db.store.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });

    return records.map(toOrganizationStoreSummary);
  }
}
