import {
  Prisma,
  type PrismaClient,
  type Category as PrismaCategory,
} from "@prisma/client";
import { buildCatalogueListResult, type Category } from "@commerceflow/types";

import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "@commerceflow/validation";
import type { CategoryRepository } from "./category.repository";

function toCategory(record: PrismaCategory): Category {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    parentId: record.parentId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(
  query: ListCategoriesQuery,
): Prisma.CategoryWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.parentId ? { parentId: query.parentId } : {}),
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

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Category | null> {
    const record = await this.db.category.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toCategory(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Category | null> {
    const record = await this.db.category.findFirst({
      where: {
        storeId,
        slug: slug.trim().toLowerCase(),
        deletedAt: null,
      },
    });

    return record ? toCategory(record) : null;
  }

  async list(query: ListCategoriesQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.category.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
      }),
      this.db.category.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toCategory),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const record = await this.db.category.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim(),
        parentId: input.parentId,
      },
    });

    return toCategory(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    const result = await this.db.category.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined
          ? { slug: input.slug.trim().toLowerCase() }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.parentId !== undefined
          ? { parentId: input.parentId ?? null }
          : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Category not found: ${id}`);
    }

    const record = await this.db.category.findFirstOrThrow({
      where: { id, storeId },
    });

    return toCategory(record);
  }
}
