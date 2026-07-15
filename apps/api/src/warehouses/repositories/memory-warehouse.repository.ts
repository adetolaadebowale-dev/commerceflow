import {
  buildCatalogueListResult,
  type Warehouse,
} from "@commerceflow/types";
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from "@commerceflow/validation";

import type { WarehouseRepository } from "./warehouse.repository";

export class MemoryWarehouseRepository implements WarehouseRepository {
  private readonly warehousesById = new Map<string, Warehouse>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getWarehouseCount(): number {
    return this.warehousesById.size;
  }

  async findById(storeId: string, id: string): Promise<Warehouse | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const warehouse = this.warehousesById.get(id);
    return warehouse?.storeId === storeId ? warehouse : null;
  }

  async findDefaultByStoreId(storeId: string): Promise<Warehouse | null> {
    for (const warehouse of this.warehousesById.values()) {
      if (
        warehouse.storeId === storeId &&
        warehouse.isDefault &&
        !this.deletedIds.has(warehouse.id)
      ) {
        return warehouse;
      }
    }

    return null;
  }

  async countActiveByStoreId(storeId: string): Promise<number> {
    return [...this.warehousesById.values()].filter(
      (warehouse) =>
        warehouse.storeId === storeId && !this.deletedIds.has(warehouse.id),
    ).length;
  }

  async list(query: ListWarehousesQuery) {
    let items = [...this.warehousesById.values()].filter(
      (warehouse) =>
        warehouse.storeId === query.storeId &&
        !this.deletedIds.has(warehouse.id),
    );

    if (query.status) {
      items = items.filter((warehouse) => warehouse.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(search) ||
          warehouse.code.toLowerCase().includes(search),
      );
    }

    items.sort(
      (left, right) =>
        Number(right.isDefault) - Number(left.isDefault) ||
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

  async create(input: CreateWarehouseInput): Promise<Warehouse> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    await this.assertCodeAvailable(input.storeId, input.code);

    const activeCount = await this.countActiveByStoreId(input.storeId);
    const shouldBeDefault = input.isDefault || activeCount === 0;

    if (shouldBeDefault) {
      await this.clearDefault(input.storeId);
    }

    const now = new Date().toISOString();
    const warehouse: Warehouse = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      code: input.code.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      stateProvince: input.stateProvince.trim(),
      postalCode: input.postalCode.trim(),
      countryCode: input.countryCode.trim().toUpperCase(),
      status: input.status,
      isDefault: shouldBeDefault,
      createdAt: now,
      updatedAt: now,
    };

    this.warehousesById.set(warehouse.id, warehouse);
    return warehouse;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    if (input.code !== undefined && input.code !== existing.code) {
      await this.assertCodeAvailable(storeId, input.code, id);
    }

    if (input.isDefault === true) {
      await this.clearDefault(storeId, id);
    }

    const updated: Warehouse = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() } : {}),
      ...(input.city !== undefined ? { city: input.city.trim() } : {}),
      ...(input.stateProvince !== undefined
        ? { stateProvince: input.stateProvince.trim() }
        : {}),
      ...(input.postalCode !== undefined
        ? { postalCode: input.postalCode.trim() }
        : {}),
      ...(input.countryCode !== undefined
        ? { countryCode: input.countryCode.trim().toUpperCase() }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.warehousesById.set(id, updated);
    return updated;
  }

  async activate(storeId: string, id: string): Promise<Warehouse> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    if (existing.status === "active") {
      return existing;
    }

    const activated: Warehouse = {
      ...existing,
      status: "active",
      updatedAt: new Date().toISOString(),
    };

    this.warehousesById.set(id, activated);
    return activated;
  }

  async deactivate(storeId: string, id: string): Promise<Warehouse> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    if (existing.status === "inactive") {
      return existing;
    }

    const deactivated: Warehouse = {
      ...existing,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    };

    this.warehousesById.set(id, deactivated);
    return deactivated;
  }

  async softDelete(storeId: string, id: string): Promise<Warehouse> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    this.deletedIds.add(id);
    const deleted: Warehouse = {
      ...existing,
      status: "inactive",
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    this.warehousesById.set(id, deleted);
    return deleted;
  }

  private async assertCodeAvailable(
    storeId: string,
    code: string,
    exceptId?: string,
  ): Promise<void> {
    for (const warehouse of this.warehousesById.values()) {
      if (
        warehouse.storeId === storeId &&
        warehouse.code === code.trim() &&
        !this.deletedIds.has(warehouse.id) &&
        warehouse.id !== exceptId
      ) {
        throw new Error(`Warehouse code already exists: ${code}`);
      }
    }
  }

  private async clearDefault(storeId: string, exceptId?: string): Promise<void> {
    for (const warehouse of this.warehousesById.values()) {
      if (
        warehouse.storeId === storeId &&
        warehouse.isDefault &&
        !this.deletedIds.has(warehouse.id) &&
        warehouse.id !== exceptId
      ) {
        this.warehousesById.set(warehouse.id, {
          ...warehouse,
          isDefault: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}
