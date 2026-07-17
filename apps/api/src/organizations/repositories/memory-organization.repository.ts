import type {
  Organization,
  OrganizationSettings,
  OrganizationStoreSummary,
} from "@commerceflow/types";
import type { UpdateOrganizationInput } from "@commerceflow/validation";

import type { OrganizationRepository } from "./organization.repository";

export class MemoryOrganizationRepository implements OrganizationRepository {
  private readonly organizationsById = new Map<string, Organization>();
  private readonly storesByOrganizationId = new Map<
    string,
    OrganizationStoreSummary[]
  >();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  seedOrganization(
    input: Partial<Organization> & Pick<Organization, "id" | "name" | "slug">,
  ): Organization {
    const now = new Date().toISOString();
    const organization: Organization = {
      settings: {},
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.organizationsById.set(organization.id, organization);
    return organization;
  }

  seedStore(summary: OrganizationStoreSummary): OrganizationStoreSummary {
    const stores = this.storesByOrganizationId.get(summary.organizationId) ?? [];
    this.storesByOrganizationId.set(summary.organizationId, [...stores, summary]);
    return summary;
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationsById.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    for (const organization of this.organizationsById.values()) {
      if (organization.slug === slug) {
        return organization;
      }
    }

    return null;
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.organizationsById.get(id);

    if (!existing) {
      throw new Error("Organization not found");
    }

    const updated: Organization = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.organizationsById.set(id, updated);
    return updated;
  }

  async listStores(
    organizationId: string,
  ): Promise<readonly OrganizationStoreSummary[]> {
    return [...(this.storesByOrganizationId.get(organizationId) ?? [])].sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );
  }

  updateSettings(id: string, settings: OrganizationSettings): Organization {
    const existing = this.organizationsById.get(id);

    if (!existing) {
      throw new Error("Organization not found");
    }

    const updated: Organization = {
      ...existing,
      settings,
      updatedAt: new Date().toISOString(),
    };

    this.organizationsById.set(id, updated);
    return updated;
  }
}
