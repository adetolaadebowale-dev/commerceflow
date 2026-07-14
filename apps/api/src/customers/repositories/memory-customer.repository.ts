import {
  buildCatalogueListResult,
  type Customer,
  type CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "@commerceflow/validation";

import type { CustomerRepository } from "./customer.repository";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class MemoryCustomerRepository implements CustomerRepository {
  private readonly customersById = new Map<string, Customer>();
  private readonly deletedIds = new Set<string>();

  async findById(storeId: string, id: string): Promise<Customer | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const customer = this.customersById.get(id);
    return customer?.storeId === storeId ? customer : null;
  }

  async findByEmail(storeId: string, email: string): Promise<Customer | null> {
    const normalizedEmail = normalizeEmail(email);

    for (const customer of this.customersById.values()) {
      if (
        customer.storeId === storeId &&
        customer.email === normalizedEmail &&
        !this.deletedIds.has(customer.id)
      ) {
        return customer;
      }
    }

    return null;
  }

  async list(query: ListCustomersQuery): Promise<CatalogueListResult<Customer>> {
    let items = [...this.customersById.values()].filter(
      (customer) =>
        customer.storeId === query.storeId && !this.deletedIds.has(customer.id),
    );

    if (query.status) {
      items = items.filter((customer) => customer.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (customer) =>
          customer.email.includes(search) ||
          customer.firstName.toLowerCase().includes(search) ||
          customer.lastName.toLowerCase().includes(search),
      );
    }

    items.sort((left, right) => {
      const lastNameCompare = left.lastName.localeCompare(right.lastName);
      return lastNameCompare !== 0
        ? lastNameCompare
        : left.firstName.localeCompare(right.firstName);
    });

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

  async create(input: CreateCustomerInput): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      email: normalizeEmail(input.email),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim(),
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.customersById.set(customer.id, customer);
    return customer;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Customer not found: ${id}`);
    }

    const updated: Customer = {
      ...existing,
      ...(input.email !== undefined
        ? { email: normalizeEmail(input.email) }
        : {}),
      ...(input.firstName !== undefined
        ? { firstName: input.firstName.trim() }
        : {}),
      ...(input.lastName !== undefined
        ? { lastName: input.lastName.trim() }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.customersById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<Customer> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Customer not found: ${id}`);
    }

    this.deletedIds.add(id);
    return existing;
  }
}
