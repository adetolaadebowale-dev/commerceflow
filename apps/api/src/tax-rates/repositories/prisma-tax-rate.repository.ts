import {
  Prisma,
  type PrismaClient,
  type TaxRate as PrismaTaxRate,
} from "@prisma/client";
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

function toTaxRate(record: PrismaTaxRate): TaxRate {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    percentage: record.percentage.toString(),
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListTaxRatesQuery): Prisma.TaxRateWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {}),
  };
}

export class PrismaTaxRateRepository implements TaxRateRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<TaxRate | null> {
    const record = await this.db.taxRate.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toTaxRate(record) : null;
  }

  async findActiveByStoreId(storeId: string): Promise<TaxRate | null> {
    const record = await this.db.taxRate.findFirst({
      where: { storeId, status: "active", deletedAt: null },
    });

    return record ? toTaxRate(record) : null;
  }

  async list(query: ListTaxRatesQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.taxRate.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.taxRate.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toTaxRate),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateTaxRateInput): Promise<TaxRate> {
    const record = await this.db.taxRate.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        percentage: input.percentage,
        status: input.status,
      },
    });

    return toTaxRate(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateTaxRateInput,
  ): Promise<TaxRate> {
    const result = await this.db.taxRate.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.percentage !== undefined ? { percentage: input.percentage } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    const record = await this.db.taxRate.findFirstOrThrow({
      where: { id, storeId },
    });

    return toTaxRate(record);
  }

  async activate(storeId: string, id: string): Promise<TaxRate> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.taxRate.findFirst({
        where: { id, storeId, deletedAt: null },
      });

      if (!existing) {
        throw new Error(`Tax rate not found: ${id}`);
      }

      await tx.taxRate.updateMany({
        where: {
          storeId,
          status: "active",
          deletedAt: null,
          NOT: { id },
        },
        data: { status: "inactive" },
      });

      const updated = await tx.taxRate.updateMany({
        where: { id, storeId, deletedAt: null },
        data: { status: "active" },
      });

      if (updated.count === 0) {
        throw new Error(`Tax rate not found: ${id}`);
      }

      const record = await tx.taxRate.findFirstOrThrow({
        where: { id, storeId },
      });

      return toTaxRate(record);
    });
  }

  async deactivate(storeId: string, id: string): Promise<TaxRate> {
    const result = await this.db.taxRate.updateMany({
      where: { id, storeId, deletedAt: null, status: "active" },
      data: { status: "inactive" },
    });

    if (result.count === 0) {
      const existing = await this.db.taxRate.findFirst({
        where: { id, storeId, deletedAt: null },
      });

      if (!existing) {
        throw new Error(`Tax rate not found: ${id}`);
      }

      if (existing.status === "inactive") {
        return toTaxRate(existing);
      }

      throw new Error(`Tax rate transition rejected: ${existing.status} -> inactive`);
    }

    const record = await this.db.taxRate.findFirstOrThrow({
      where: { id, storeId },
    });

    return toTaxRate(record);
  }

  async softDelete(storeId: string, id: string): Promise<TaxRate> {
    const result = await this.db.taxRate.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date(), status: "inactive" },
    });

    if (result.count === 0) {
      throw new Error(`Tax rate not found: ${id}`);
    }

    const record = await this.db.taxRate.findFirstOrThrow({
      where: { id, storeId },
    });

    return toTaxRate(record);
  }
}
