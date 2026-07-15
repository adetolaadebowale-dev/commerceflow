import {
  buildCatalogueListResult,
  type TaxRate,
} from "@commerceflow/types";
import type {
  CreateTaxRateInput,
  ListTaxRatesQuery,
  UpdateTaxRateInput,
} from "@commerceflow/validation";

import type { TaxRateRepository } from "./tax-rate.repository";

export class MemoryTaxRateRepository implements TaxRateRepository {
  private readonly taxRatesById = new Map<string, TaxRate>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getTaxRateCount(): number {
    return this.taxRatesById.size;
  }

  async findById(storeId: string, id: string): Promise<TaxRate | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const taxRate = this.taxRatesById.get(id);
    return taxRate?.storeId === storeId ? taxRate : null;
  }

  async findActiveByStoreId(storeId: string): Promise<TaxRate | null> {
    for (const taxRate of this.taxRatesById.values()) {
      if (
        taxRate.storeId === storeId &&
        taxRate.status === "active" &&
        !this.deletedIds.has(taxRate.id)
      ) {
        return taxRate;
      }
    }

    return null;
  }

  async list(query: ListTaxRatesQuery) {
    let items = [...this.taxRatesById.values()].filter(
      (taxRate) =>
        taxRate.storeId === query.storeId && !this.deletedIds.has(taxRate.id),
    );

    if (query.status) {
      items = items.filter((taxRate) => taxRate.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter((taxRate) =>
        taxRate.name.toLowerCase().includes(search),
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateTaxRateInput): Promise<TaxRate> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    if (input.status === "active") {
      const existingActive = await this.findActiveByStoreId(input.storeId);
      if (existingActive) {
        throw new Error(
          `Tax rate active already exists: ${input.storeId}`,
        );
      }
    }

    const now = new Date().toISOString();
    const taxRate: TaxRate = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      percentage: input.percentage,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.taxRatesById.set(taxRate.id, taxRate);
    return taxRate;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateTaxRateInput,
  ): Promise<TaxRate> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    if (input.status === "active" && existing.status !== "active") {
      const active = await this.findActiveByStoreId(storeId);
      if (active && active.id !== id) {
        throw new Error(`Tax rate active already exists: ${storeId}`);
      }
    }

    const updated: TaxRate = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      percentage: input.percentage ?? existing.percentage,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    this.taxRatesById.set(id, updated);
    return updated;
  }

  async activate(storeId: string, id: string): Promise<TaxRate> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    for (const taxRate of this.taxRatesById.values()) {
      if (
        taxRate.storeId === storeId &&
        taxRate.status === "active" &&
        taxRate.id !== id &&
        !this.deletedIds.has(taxRate.id)
      ) {
        this.taxRatesById.set(taxRate.id, {
          ...taxRate,
          status: "inactive",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const activated: TaxRate = {
      ...existing,
      status: "active",
      updatedAt: new Date().toISOString(),
    };

    this.taxRatesById.set(id, activated);
    return activated;
  }

  async deactivate(storeId: string, id: string): Promise<TaxRate> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    const deactivated: TaxRate = {
      ...existing,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    };

    this.taxRatesById.set(id, deactivated);
    return deactivated;
  }

  async softDelete(storeId: string, id: string): Promise<TaxRate> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    this.deletedIds.add(id);
    const deleted: TaxRate = {
      ...existing,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    };
    this.taxRatesById.set(id, deleted);
    return deleted;
  }
}
