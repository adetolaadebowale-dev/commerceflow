import {
  Prisma,
  type PrismaClient,
  type Promotion as PrismaPromotion,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Promotion,
} from "@commerceflow/types";
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from "@commerceflow/validation";

import type { PromotionRepository } from "./promotion.repository";

function toPromotion(record: PrismaPromotion): Promotion {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    code: record.code,
    description: record.description ?? undefined,
    type: record.type,
    value: record.value.toString(),
    currency: record.currency ?? undefined,
    status: record.status,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListPromotionsQuery): Prisma.PromotionWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search.toUpperCase(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export class PrismaPromotionRepository implements PromotionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Promotion | null> {
    const record = await this.db.promotion.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    return record ? toPromotion(record) : null;
  }

  async findActiveByCode(
    storeId: string,
    code: string,
    excludeId?: string,
  ): Promise<Promotion | null> {
    const record = await this.db.promotion.findFirst({
      where: {
        storeId,
        code: code.trim().toUpperCase(),
        status: "active",
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    return record ? toPromotion(record) : null;
  }

  async list(query: ListPromotionsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.promotion.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.promotion.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toPromotion),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreatePromotionInput): Promise<Promotion> {
    const record = await this.db.promotion.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description?.trim(),
        type: input.type,
        value: input.value,
        currency: input.type === "fixed_amount" ? input.currency : null,
        status: input.status,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      },
    });

    return toPromotion(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdatePromotionInput,
  ): Promise<Promotion> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Promotion not found: ${id}`);
    }

    const nextType = input.type ?? existing.type;
    const nextCurrency =
      nextType === "percentage"
        ? null
        : input.currency !== undefined
          ? input.currency
          : existing.currency ?? null;

    const result = await this.db.promotion.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined
          ? { code: input.code.trim().toUpperCase() }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.type !== undefined || input.currency !== undefined
          ? { currency: nextCurrency }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.startsAt !== undefined
          ? { startsAt: new Date(input.startsAt) }
          : {}),
        ...(input.endsAt !== undefined ? { endsAt: new Date(input.endsAt) } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Promotion not found: ${id}`);
    }

    const record = await this.db.promotion.findFirstOrThrow({
      where: { id, storeId },
    });

    return toPromotion(record);
  }

  async softDelete(storeId: string, id: string): Promise<Promotion> {
    const result = await this.db.promotion.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new Error(`Promotion not found: ${id}`);
    }

    const record = await this.db.promotion.findFirstOrThrow({
      where: { id, storeId },
    });

    return toPromotion(record);
  }
}
