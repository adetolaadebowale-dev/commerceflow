import {
  Prisma,
  type PrismaClient,
  type Warehouse as PrismaWarehouse,
} from "@prisma/client";
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

function toWarehouse(record: PrismaWarehouse): Warehouse {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    code: record.code,
    address: record.address,
    city: record.city,
    stateProvince: record.stateProvince,
    postalCode: record.postalCode,
    countryCode: record.countryCode,
    status: record.status,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListWarehousesQuery): Prisma.WarehouseWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function buildCreateData(input: CreateWarehouseInput) {
  return {
    storeId: input.storeId,
    name: input.name.trim(),
    code: input.code.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    stateProvince: input.stateProvince.trim(),
    postalCode: input.postalCode.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    status: input.status,
    isDefault: input.isDefault,
  };
}

function buildUpdateData(input: UpdateWarehouseInput) {
  return {
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
  };
}

export class PrismaWarehouseRepository implements WarehouseRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Warehouse | null> {
    const record = await this.db.warehouse.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toWarehouse(record) : null;
  }

  async findDefaultByStoreId(storeId: string): Promise<Warehouse | null> {
    const record = await this.db.warehouse.findFirst({
      where: { storeId, isDefault: true, deletedAt: null },
    });

    return record ? toWarehouse(record) : null;
  }

  async countActiveByStoreId(storeId: string): Promise<number> {
    return this.db.warehouse.count({
      where: { storeId, deletedAt: null },
    });
  }

  async list(query: ListWarehousesQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.warehouse.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.warehouse.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toWarehouse),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateWarehouseInput): Promise<Warehouse> {
    const activeCount = await this.countActiveByStoreId(input.storeId);
    const shouldBeDefault = input.isDefault || activeCount === 0;

    return this.db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.warehouse.updateMany({
          where: {
            storeId: input.storeId,
            deletedAt: null,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const record = await tx.warehouse.create({
        data: {
          ...buildCreateData(input),
          isDefault: shouldBeDefault,
        },
      });

      return toWarehouse(record);
    });
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    return this.db.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.warehouse.updateMany({
          where: {
            storeId,
            deletedAt: null,
            isDefault: true,
            NOT: { id },
          },
          data: { isDefault: false },
        });
      }

      const result = await tx.warehouse.updateMany({
        where: { id, storeId, deletedAt: null },
        data: buildUpdateData(input),
      });

      if (result.count === 0) {
        throw new Error(`Warehouse not found: ${id}`);
      }

      const record = await tx.warehouse.findFirstOrThrow({
        where: { id, storeId },
      });

      return toWarehouse(record);
    });
  }

  async activate(storeId: string, id: string): Promise<Warehouse> {
    const result = await this.db.warehouse.updateMany({
      where: { id, storeId, deletedAt: null, status: "inactive" },
      data: { status: "active" },
    });

    if (result.count === 0) {
      const existing = await this.db.warehouse.findFirst({
        where: { id, storeId, deletedAt: null },
      });

      if (!existing) {
        throw new Error(`Warehouse not found: ${id}`);
      }

      if (existing.status === "active") {
        return toWarehouse(existing);
      }

      throw new Error(
        `Warehouse transition rejected: ${existing.status} -> active`,
      );
    }

    const record = await this.db.warehouse.findFirstOrThrow({
      where: { id, storeId },
    });

    return toWarehouse(record);
  }

  async deactivate(storeId: string, id: string): Promise<Warehouse> {
    const result = await this.db.warehouse.updateMany({
      where: { id, storeId, deletedAt: null, status: "active" },
      data: { status: "inactive" },
    });

    if (result.count === 0) {
      const existing = await this.db.warehouse.findFirst({
        where: { id, storeId, deletedAt: null },
      });

      if (!existing) {
        throw new Error(`Warehouse not found: ${id}`);
      }

      if (existing.status === "inactive") {
        return toWarehouse(existing);
      }

      throw new Error(
        `Warehouse transition rejected: ${existing.status} -> inactive`,
      );
    }

    const record = await this.db.warehouse.findFirstOrThrow({
      where: { id, storeId },
    });

    return toWarehouse(record);
  }

  async softDelete(storeId: string, id: string): Promise<Warehouse> {
    const result = await this.db.warehouse.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date(), status: "inactive", isDefault: false },
    });

    if (result.count === 0) {
      throw new Error(`Warehouse not found: ${id}`);
    }

    const record = await this.db.warehouse.findFirstOrThrow({
      where: { id, storeId },
    });

    return toWarehouse(record);
  }
}
