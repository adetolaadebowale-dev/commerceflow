import { Prisma } from "@prisma/client";
import type { Organization, OrganizationStoreSummary } from "@commerceflow/types";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { ORGANIZATION_ERROR_CODES, OrganizationError } from "../errors";
import {
  getOrganizationRepository,
  type OrganizationRepository,
} from "../repositories";
import type { UpdateOrganizationInput } from "@commerceflow/validation";

export interface OrganizationServiceDependencies {
  readonly organizationRepository?: OrganizationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class OrganizationService {
  private readonly organizationRepository: OrganizationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: OrganizationServiceDependencies = {}) {
    this.organizationRepository =
      dependencies.organizationRepository ?? getOrganizationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getOrganization(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new OrganizationError(
        ORGANIZATION_ERROR_CODES.NOT_FOUND,
        "Organization not found",
        404,
      );
    }

    return organization;
  }

  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    const existing = await this.organizationRepository.findById(id);

    if (!existing) {
      throw new OrganizationError(
        ORGANIZATION_ERROR_CODES.NOT_FOUND,
        "Organization not found",
        404,
      );
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.organizationRepository.findBySlug(
        input.slug,
      );

      if (slugConflict && slugConflict.id !== id) {
        throw new OrganizationError(
          ORGANIZATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "An organization with this slug already exists",
          409,
        );
      }
    }

    try {
      const updated = await this.organizationRepository.update(id, input);
      this.domainEventPublisher.publishOrganizationUpdated(existing, updated);
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new OrganizationError(
          ORGANIZATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "An organization with this slug already exists",
          409,
        );
      }

      if (error instanceof OrganizationError) {
        throw error;
      }

      throw new OrganizationError(
        ORGANIZATION_ERROR_CODES.REPOSITORY_ERROR,
        "Organization update failed",
        500,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async listOrganizationStores(
    organizationId: string,
  ): Promise<readonly OrganizationStoreSummary[]> {
    await this.getOrganization(organizationId);
    return this.organizationRepository.listStores(organizationId);
  }
}

export const organizationService = new OrganizationService();
