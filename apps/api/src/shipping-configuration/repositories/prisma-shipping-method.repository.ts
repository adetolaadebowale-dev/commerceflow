import {
  Prisma,
  type PrismaClient,
  type ShippingMethod as PrismaShippingMethod,
} from "@prisma/client";
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

function toShippingMethod(record: PrismaShippingMethod): ShippingMethod {
  return {
    id: record.id,
    storeId: record.storeId,
    shippingZoneId: record.shippingZoneId,
    name: record.name,
    description: record.description ?? undefined,
    carrier: record.carrier,
    flatRate: record.flatRate.toString(),
    currency: record.currency,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(
  query: ListShippingMethodsQuery,
): Prisma.ShippingMethodWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.shippingZoneId ? { shippingZoneId: query.shippingZoneId } : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {}),
  };
}

export class PrismaShippingMethodRepository implements ShippingMethodRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<ShippingMethod | null> {
    const record = await this.db.shippingMethod.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toShippingMethod(record) : null;
  }

  async countActiveByZoneId(
    storeId: string,
    shippingZoneId: string,
  ): Promise<number> {
    return this.db.shippingMethod.count({
      where: {
        storeId,
        shippingZoneId,
        status: "active",
        deletedAt: null,
      },
    });
  }

  async list(query: ListShippingMethodsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.shippingMethod.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.shippingMethod.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toShippingMethod),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateShippingMethodInput): Promise<ShippingMethod> {
    const record = await this.db.shippingMethod.create({
      data: {
        storeId: input.storeId,
        shippingZoneId: input.shippingZoneId,
        name: input.name.trim(),
        description: input.description?.trim(),
        carrier: input.carrier,
        flatRate: input.flatRate,
        currency: input.currency,
        status: input.status,
      },
    });

    return toShippingMethod(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateShippingMethodInput,
  ): Promise<ShippingMethod> {
    const result = await this.db.shippingMethod.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.shippingZoneId !== undefined
          ? { shippingZoneId: input.shippingZoneId }
          : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.carrier !== undefined ? { carrier: input.carrier } : {}),
        ...(input.flatRate !== undefined ? { flatRate: input.flatRate } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Shipping method not found: ${id}`);
    }

    const record = await this.db.shippingMethod.findFirstOrThrow({
      where: { id, storeId },
    });

    return toShippingMethod(record);
  }

  async softDelete(storeId: string, id: string): Promise<ShippingMethod> {
    const result = await this.db.shippingMethod.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error(`Shipping method not found: ${id}`);
    }

    const record = await this.db.shippingMethod.findFirstOrThrow({
      where: { id, storeId },
    });

    return toShippingMethod(record);
  }
}
