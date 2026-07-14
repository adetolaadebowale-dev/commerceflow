import {
  Prisma,
  type Customer as PrismaCustomer,
  type PrismaClient,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Customer,
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

function toCustomer(record: PrismaCustomer): Customer {
  return {
    id: record.id,
    storeId: record.storeId,
    email: record.email,
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone ?? undefined,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListCustomersQuery): Prisma.CustomerWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" } },
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Customer | null> {
    const record = await this.db.customer.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toCustomer(record) : null;
  }

  async findByEmail(storeId: string, email: string): Promise<Customer | null> {
    const record = await this.db.customer.findFirst({
      where: {
        storeId,
        email: normalizeEmail(email),
        deletedAt: null,
      },
    });

    return record ? toCustomer(record) : null;
  }

  async list(query: ListCustomersQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.customer.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toCustomer),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const record = await this.db.customer.create({
      data: {
        storeId: input.storeId,
        email: normalizeEmail(input.email),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        status: input.status,
      },
    });

    return toCustomer(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const result = await this.db.customer.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.email !== undefined
          ? { email: normalizeEmail(input.email) }
          : {}),
        ...(input.firstName !== undefined
          ? { firstName: input.firstName.trim() }
          : {}),
        ...(input.lastName !== undefined
          ? { lastName: input.lastName.trim() }
          : {}),
        ...(input.phone !== undefined
          ? { phone: input.phone?.trim() ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Customer not found: ${id}`);
    }

    const record = await this.db.customer.findFirstOrThrow({
      where: { id, storeId },
    });

    return toCustomer(record);
  }

  async softDelete(storeId: string, id: string): Promise<Customer> {
    const result = await this.db.customer.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error(`Customer not found: ${id}`);
    }

    const record = await this.db.customer.findFirstOrThrow({
      where: { id, storeId },
    });

    return toCustomer(record);
  }
}
