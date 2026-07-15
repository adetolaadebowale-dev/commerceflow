import {
  buildCatalogueListResult,
  type ShippingZone,
} from "@commerceflow/types";
import type {
  CreateShippingZoneInput,
  ListShippingZonesQuery,
  UpdateShippingZoneInput,
} from "@commerceflow/validation";

import type { ShippingZoneRepository } from "./shipping-zone.repository";

function normalizeCountries(countries: readonly string[]): string[] {
  return countries.map((country) => country.toUpperCase());
}

export class MemoryShippingZoneRepository implements ShippingZoneRepository {
  private readonly zonesById = new Map<string, ShippingZone>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<ShippingZone | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const zone = this.zonesById.get(id);
    return zone?.storeId === storeId ? zone : null;
  }

  async list(query: ListShippingZonesQuery) {
    let items = [...this.zonesById.values()].filter(
      (zone) =>
        zone.storeId === query.storeId && !this.deletedIds.has(zone.id),
    );

    if (query.status) {
      items = items.filter((zone) => zone.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter((zone) => zone.name.toLowerCase().includes(search));
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

  async create(input: CreateShippingZoneInput): Promise<ShippingZone> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const zone: ShippingZone = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      countries: normalizeCountries(input.countries),
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.zonesById.set(zone.id, zone);
    return zone;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateShippingZoneInput,
  ): Promise<ShippingZone> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Shipping zone not found: ${id}`);
    }

    const updated: ShippingZone = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.countries !== undefined
        ? { countries: normalizeCountries(input.countries) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.zonesById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<ShippingZone> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Shipping zone not found: ${id}`);
    }

    this.deletedIds.add(id);
    return existing;
  }
}
