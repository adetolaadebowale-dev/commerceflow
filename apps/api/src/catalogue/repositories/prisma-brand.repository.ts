import {
  Prisma,
  type PrismaClient,
  type Brand as PrismaBrand,
} from "@prisma/client";
import { buildCatalogueListResult, type Brand } from "@commerceflow/types";
import type {
  CreateBrandInput,
  ListBrandsQuery,
  UpdateBrandInput,
} from "@commerceflow/validation";

import type { BrandRepository } from "./brand.repository";

function toBrand(record: PrismaBrand): Brand {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListBrandsQuery): Prisma.BrandWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export class PrismaBrandRepository implements BrandRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Brand | null> {
    const record = await this.db.brand.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toBrand(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Brand | null> {
    const record = await this.db.brand.findFirst({
      where: {
        storeId,
        slug: slug.trim().toLowerCase(),
        deletedAt: null,
      },
    });

    return record ? toBrand(record) : null;
  }

  async list(query: ListBrandsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.brand.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
      }),
      this.db.brand.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toBrand),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateBrandInput): Promise<Brand> {
    const record = await this.db.brand.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim(),
      },
    });

    return toBrand(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateBrandInput,
  ): Promise<Brand> {
    const result = await this.db.brand.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined
          ? { slug: input.slug.trim().toLowerCase() }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Brand not found: ${id}`);
    }

    const record = await this.db.brand.findFirstOrThrow({
      where: { id, storeId },
    });

    return toBrand(record);
  }

  async softDelete(storeId: string, id: string): Promise<Brand> {
    const result = await this.db.brand.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error(`Brand not found: ${id}`);
    }

    const record = await this.db.brand.findFirstOrThrow({
      where: { id, storeId },
    });

    return toBrand(record);
  }
}
