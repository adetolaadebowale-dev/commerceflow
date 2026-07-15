import { Prisma } from "@prisma/client";
import type { TaxRate } from "@commerceflow/types";
import type {
  CreateTaxRateInput,
  ListTaxRatesQuery,
  UpdateTaxRateInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { TAX_RATE_ERROR_CODES, TaxRateError } from "../errors";
import {
  getTaxRateRepository,
  type TaxRateRepository,
} from "../repositories";

export interface TaxRateServiceDependencies {
  readonly taxRateRepository?: TaxRateRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class TaxRateService {
  private readonly taxRateRepository: TaxRateRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: TaxRateServiceDependencies = {}) {
    this.taxRateRepository =
      dependencies.taxRateRepository ?? getTaxRateRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createTaxRate(input: CreateTaxRateInput): Promise<TaxRate> {
    this.assertPercentage(input.percentage);

    if (input.status === "active") {
      await this.assertNoActiveRate(input.storeId);
    }

    try {
      const taxRate = await this.taxRateRepository.create(input);
      this.domainEventPublisher.publishTaxCreated(taxRate);

      if (taxRate.status === "active") {
        this.domainEventPublisher.publishTaxActivated(taxRate, "inactive");
      }

      return taxRate;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateTaxRate(
    storeId: string,
    id: string,
    input: UpdateTaxRateInput,
  ): Promise<TaxRate> {
    const existing = await this.requireTaxRate(storeId, id);

    if (input.percentage !== undefined) {
      this.assertPercentage(input.percentage);
    }

    const { status, ...fieldUpdates } = input;
    let taxRate = existing;

    if (Object.keys(fieldUpdates).length > 0) {
      try {
        taxRate = await this.taxRateRepository.update(storeId, id, fieldUpdates);
        this.domainEventPublisher.publishTaxUpdated(taxRate);
      } catch (error) {
        throw this.mapRepositoryError(error);
      }
    }

    if (status === "active" && taxRate.status !== "active") {
      return this.activateTaxRate(storeId, id);
    }

    if (status === "inactive" && taxRate.status === "active") {
      return this.deactivateTaxRate(storeId, id);
    }

    return taxRate;
  }

  async getTaxRate(storeId: string, id: string): Promise<TaxRate> {
    const taxRate = await this.taxRateRepository.findById(storeId, id);

    if (!taxRate) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.NOT_FOUND,
        "Tax rate not found",
        404,
      );
    }

    return taxRate;
  }

  async getActiveTaxRate(storeId: string): Promise<TaxRate | null> {
    return this.taxRateRepository.findActiveByStoreId(storeId);
  }

  async listTaxRates(query: ListTaxRatesQuery) {
    return this.taxRateRepository.list(query);
  }

  async activateTaxRate(storeId: string, id: string): Promise<TaxRate> {
    const existing = await this.requireTaxRate(storeId, id);

    if (existing.status === "active") {
      return existing;
    }

    try {
      const taxRate = await this.taxRateRepository.activate(storeId, id);
      this.domainEventPublisher.publishTaxActivated(taxRate, existing.status);
      return taxRate;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async deactivateTaxRate(storeId: string, id: string): Promise<TaxRate> {
    const existing = await this.requireTaxRate(storeId, id);

    if (existing.status === "inactive") {
      return existing;
    }

    try {
      const taxRate = await this.taxRateRepository.deactivate(storeId, id);
      this.domainEventPublisher.publishTaxDeactivated(taxRate, existing.status);
      return taxRate;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async softDeleteTaxRate(storeId: string, id: string): Promise<TaxRate> {
    const existing = await this.requireTaxRate(storeId, id);

    try {
      const taxRate = await this.taxRateRepository.softDelete(storeId, id);

      if (existing.status === "active") {
        this.domainEventPublisher.publishTaxDeactivated(taxRate, existing.status);
      }

      return taxRate;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertPercentage(percentage: string): void {
    const numericValue = Number.parseFloat(percentage);

    if (numericValue < 0 || numericValue > 100) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Percentage must be between 0 and 100",
        400,
      );
    }
  }

  private async assertNoActiveRate(
    storeId: string,
    excludeId?: string,
  ): Promise<void> {
    const active = await this.taxRateRepository.findActiveByStoreId(storeId);

    if (active && active.id !== excludeId) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.ACTIVE_RATE_ALREADY_EXISTS,
        "Store already has an active tax rate",
        409,
      );
    }
  }

  private async requireTaxRate(storeId: string, id: string): Promise<TaxRate> {
    const taxRate = await this.taxRateRepository.findById(storeId, id);

    if (!taxRate) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.NOT_FOUND,
        "Tax rate not found",
        404,
      );
    }

    return taxRate;
  }

  private mapRepositoryError(error: unknown): TaxRateError {
    if (error instanceof Error && error.message.startsWith("Tax rate not found:")) {
      return new TaxRateError(
        TAX_RATE_ERROR_CODES.NOT_FOUND,
        "Tax rate not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Tax rate active already exists:")
    ) {
      return new TaxRateError(
        TAX_RATE_ERROR_CODES.ACTIVE_RATE_ALREADY_EXISTS,
        "Store already has an active tax rate",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new TaxRateError(
        TAX_RATE_ERROR_CODES.ACTIVE_RATE_ALREADY_EXISTS,
        "Store already has an active tax rate",
        409,
      );
    }

    if (error instanceof TaxRateError) {
      return error;
    }

    return new TaxRateError(
      TAX_RATE_ERROR_CODES.TRANSACTION_FAILED,
      "Tax rate transaction failed",
      500,
    );
  }
}

export const taxRateService = new TaxRateService();
