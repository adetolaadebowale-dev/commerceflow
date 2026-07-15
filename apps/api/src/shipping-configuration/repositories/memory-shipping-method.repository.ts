import {
  buildCatalogueListResult,
  type ShippingMethod,
} from "@commerceflow/types";
import type {
  CreateShippingMethodInput,
  ListShippingMethodsQuery,
  UpdateShippingMethodInput,
} from "@commerceflow/validation";

import type { ShippingMethodRepository } from "./shipping-method.repository";

export class MemoryShippingMethodRepository implements ShippingMethodRepository {
  private readonly methodsById = new Map<string, ShippingMethod>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findById(storeId: string, id: string): Promise<ShippingMethod | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const method = this.methodsById.get(id);
    return method?.storeId === storeId ? method : null;
  }

  async countActiveByZoneId(
    storeId: string,
    shippingZoneId: string,
  ): Promise<number> {
    let count = 0;

    for (const method of this.methodsById.values()) {
      if (
        method.storeId === storeId &&
        method.shippingZoneId === shippingZoneId &&
        method.status === "active" &&
        !this.deletedIds.has(method.id)
      ) {
        count += 1;
      }
    }

    return count;
  }

  async list(query: ListShippingMethodsQuery) {
    let items = [...this.methodsById.values()].filter(
      (method) =>
        method.storeId === query.storeId && !this.deletedIds.has(method.id),
    );

    if (query.status) {
      items = items.filter((method) => method.status === query.status);
    }

    if (query.shippingZoneId) {
      items = items.filter(
        (method) => method.shippingZoneId === query.shippingZoneId,
      );
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter((method) =>
        method.name.toLowerCase().includes(search),
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

  async create(input: CreateShippingMethodInput): Promise<ShippingMethod> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const method: ShippingMethod = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      shippingZoneId: input.shippingZoneId,
      name: input.name.trim(),
      description: input.description?.trim(),
      carrier: input.carrier,
      flatRate: input.flatRate,
      currency: input.currency,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.methodsById.set(method.id, method);
    return method;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateShippingMethodInput,
  ): Promise<ShippingMethod> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Shipping method not found: ${id}`);
    }

    const updated: ShippingMethod = {
      ...existing,
      ...(input.shippingZoneId !== undefined
        ? { shippingZoneId: input.shippingZoneId }
        : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() }
        : {}),
      ...(input.carrier !== undefined ? { carrier: input.carrier } : {}),
      ...(input.flatRate !== undefined ? { flatRate: input.flatRate } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.methodsById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<ShippingMethod> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Shipping method not found: ${id}`);
    }

    this.deletedIds.add(id);
    return existing;
  }
}
