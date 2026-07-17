import { Prisma } from "@prisma/client";
import type { StoreConfiguration } from "@commerceflow/types";
import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  STORE_ADMINISTRATION_ERROR_CODES,
  StoreAdministrationError,
} from "../errors";
import {
  getStoreAdministrationRepository,
  type StoreAdministrationRepository,
} from "../repositories";

export interface StoreAdministrationServiceDependencies {
  readonly storeAdministrationRepository?: StoreAdministrationRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class StoreAdministrationService {
  private readonly storeAdministrationRepository: StoreAdministrationRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: StoreAdministrationServiceDependencies = {}) {
    this.storeAdministrationRepository =
      dependencies.storeAdministrationRepository ??
      getStoreAdministrationRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getStoreSettings(storeId: string): Promise<StoreConfiguration> {
    const store = await this.storeAdministrationRepository.findById(storeId);

    if (!store) {
      throw new StoreAdministrationError(
        STORE_ADMINISTRATION_ERROR_CODES.NOT_FOUND,
        "Store not found",
        404,
      );
    }

    return store;
  }

  async updateStoreSettings(
    storeId: string,
    input: UpdateStoreSettingsInput,
  ): Promise<StoreConfiguration> {
    const existing = await this.storeAdministrationRepository.findById(storeId);

    if (!existing) {
      throw new StoreAdministrationError(
        STORE_ADMINISTRATION_ERROR_CODES.NOT_FOUND,
        "Store not found",
        404,
      );
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict =
        await this.storeAdministrationRepository.findByOrganizationAndSlug(
          existing.organizationId,
          input.slug,
        );

      if (slugConflict && slugConflict.id !== storeId) {
        throw new StoreAdministrationError(
          STORE_ADMINISTRATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A store with this slug already exists in the organization",
          409,
        );
      }
    }

    try {
      const updated = await this.storeAdministrationRepository.updateSettings(
        storeId,
        input,
      );
      this.domainEventPublisher.publishStoreSettingsUpdated(existing, updated);
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new StoreAdministrationError(
          STORE_ADMINISTRATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A store with this slug already exists in the organization",
          409,
        );
      }

      if (error instanceof StoreAdministrationError) {
        throw error;
      }

      throw new StoreAdministrationError(
        STORE_ADMINISTRATION_ERROR_CODES.REPOSITORY_ERROR,
        "Store settings update failed",
        500,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

export const storeAdministrationService = new StoreAdministrationService();
