import {
  Prisma,
  type PrismaClient,
  type ShippingZone as PrismaShippingZone,
} from "@prisma/client";
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

function toShippingZone(record: PrismaShippingZone): ShippingZone {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    countries: record.countries,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function normalizeCountries(countries: readonly string[]): string[] {
  return countries.map((country) => country.toUpperCase());
}

function buildListWhere(
  query: ListShippingZonesQuery,
): Prisma.ShippingZoneWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {}),
  };
}

export class PrismaShippingZoneRepository implements ShippingZoneRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<ShippingZone | null> {
    const record = await this.db.shippingZone.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toShippingZone(record) : null;
  }

  async list(query: ListShippingZonesQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.shippingZone.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.shippingZone.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toShippingZone),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateShippingZoneInput): Promise<ShippingZone> {
    const record = await this.db.shippingZone.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        countries: normalizeCountries(input.countries),
        status: input.status,
      },
    });

    return toShippingZone(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateShippingZoneInput,
  ): Promise<ShippingZone> {
    const result = await this.db.shippingZone.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.countries !== undefined
          ? { countries: normalizeCountries(input.countries) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Shipping zone not found: ${id}`);
    }

    const record = await this.db.shippingZone.findFirstOrThrow({
      where: { id, storeId },
    });

    return toShippingZone(record);
  }

  async softDelete(storeId: string, id: string): Promise<ShippingZone> {
    const result = await this.db.shippingZone.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error(`Shipping zone not found: ${id}`);
    }

    const record = await this.db.shippingZone.findFirstOrThrow({
      where: { id, storeId },
    });

    return toShippingZone(record);
  }
}
