import {
  Prisma,
  type PrismaClient,
  type Product as PrismaProduct,
  type ProductVariant as PrismaProductVariant,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Product,
  type ProductVariant,
} from "@commerceflow/types";

import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@commerceflow/validation";
import type { ProductRepository } from "./product.repository";

type ProductWithVariants = PrismaProduct & {
  variants: PrismaProductVariant[];
};

function toVariant(record: PrismaProductVariant): ProductVariant {
  return {
    id: record.id,
    productId: record.productId,
    sku: record.sku,
    name: record.name,
    price: record.price.toString(),
    currency: record.currency,
    attributes:
      record.attributes && typeof record.attributes === "object"
        ? (record.attributes as Record<string, string>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toProduct(record: ProductWithVariants): Product {
  return {
    id: record.id,
    storeId: record.storeId,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    status: record.status,
    categoryId: record.categoryId,
    brandId: record.brandId ?? undefined,
    variants: record.variants
      .filter((variant) => variant.deletedAt === null)
      .map(toVariant),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(query.status ? { status: query.status } : {}),
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

const variantInclude = {
  where: { deletedAt: null },
  orderBy: { createdAt: "asc" as const },
};

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Product | null> {
    const record = await this.db.product.findFirst({
      where: { id, storeId, deletedAt: null },
      include: { variants: variantInclude },
    });

    return record ? toProduct(record) : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Product | null> {
    const record = await this.db.product.findFirst({
      where: {
        storeId,
        slug: slug.trim().toLowerCase(),
        deletedAt: null,
      },
      include: { variants: variantInclude },
    });

    return record ? toProduct(record) : null;
  }

  async list(query: ListProductsQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.product.findMany({
        where,
        include: { variants: variantInclude },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.db.product.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toProduct),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateProductInput): Promise<Product> {
    const record = await this.db.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          storeId: input.storeId,
          name: input.name.trim(),
          slug: input.slug.trim().toLowerCase(),
          description: input.description?.trim(),
          status: input.status,
          categoryId: input.categoryId,
          brandId: input.brandId,
          variants: {
            create: input.variants.map((variant) => ({
              storeId: input.storeId,
              sku: variant.sku.trim(),
              name: variant.name.trim(),
              price: variant.price,
              currency: variant.currency,
              attributes: variant.attributes,
            })),
          },
        },
        include: { variants: variantInclude },
      });
    });

    return toProduct(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const result = await this.db.product.updateMany({
      where: { id, storeId, deletedAt: null },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined
          ? { slug: input.slug.trim().toLowerCase() }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
      },
    });

    if (result.count === 0) {
      throw new Error(`Product not found: ${id}`);
    }

    const record = await this.db.product.findFirstOrThrow({
      where: { id, storeId },
      include: { variants: variantInclude },
    });

    return toProduct(record);
  }

  async brandExists(storeId: string, id: string): Promise<boolean> {
    const brand = await this.db.brand.findFirst({
      where: { id, storeId, deletedAt: null },
      select: { id: true },
    });

    return brand !== null;
  }
}
