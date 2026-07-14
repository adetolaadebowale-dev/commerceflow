import {
  buildCatalogueListResult,
  type Product,
  type CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@commerceflow/validation";

import type { ProductRepository } from "./product.repository";

export class MemoryProductRepository implements ProductRepository {
  private readonly productsById = new Map<string, Product>();
  private readonly brandsByStore = new Map<string, Set<string>>();
  private readonly deletedIds = new Set<string>();
  private createFailure: Error | null = null;

  seedBrand(storeId: string, id: string): void {
    const brands = this.brandsByStore.get(storeId) ?? new Set<string>();
    brands.add(id);
    this.brandsByStore.set(storeId, brands);
  }

  /** Simulates a failure during product creation for rollback tests. */
  setCreateFailure(error: Error | null): void {
    this.createFailure = error;
  }

  /** Marks a product as soft-deleted for test scenarios. */
  softDelete(id: string): void {
    this.deletedIds.add(id);
  }

  getProductCount(): number {
    return this.productsById.size;
  }

  async findById(storeId: string, id: string): Promise<Product | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const product = this.productsById.get(id);
    return product?.storeId === storeId ? product : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Product | null> {
    const normalizedSlug = slug.trim().toLowerCase();

    for (const product of this.productsById.values()) {
      if (
        product.storeId === storeId &&
        product.slug === normalizedSlug &&
        !this.deletedIds.has(product.id)
      ) {
        return product;
      }
    }

    return null;
  }

  async list(query: ListProductsQuery): Promise<CatalogueListResult<Product>> {
    let items = [...this.productsById.values()].filter(
      (product) =>
        product.storeId === query.storeId && !this.deletedIds.has(product.id),
    );

    if (query.categoryId) {
      items = items.filter((product) => product.categoryId === query.categoryId);
    }

    if (query.brandId) {
      items = items.filter((product) => product.brandId === query.brandId);
    }

    if (query.status) {
      items = items.filter((product) => product.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.slug.includes(search),
      );
    }

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

  async create(input: CreateProductInput): Promise<Product> {
    if (this.createFailure) {
      throw this.createFailure;
    }

    for (const product of this.productsById.values()) {
      if (product.storeId !== input.storeId) {
        continue;
      }

      for (const existingVariant of product.variants) {
        for (const variant of input.variants) {
          if (existingVariant.sku === variant.sku.trim()) {
            throw new Error("Unique constraint failed on sku");
          }
        }
      }
    }

    const now = new Date().toISOString();
    const productId = crypto.randomUUID();

    const product: Product = {
      id: productId,
      storeId: input.storeId,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim(),
      status: input.status,
      categoryId: input.categoryId,
      brandId: input.brandId,
      variants: input.variants.map((variant) => ({
        id: crypto.randomUUID(),
        productId,
        sku: variant.sku.trim(),
        name: variant.name.trim(),
        price: variant.price,
        currency: variant.currency,
        attributes: variant.attributes,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.productsById.set(product.id, product);
    return product;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Product not found: ${id}`);
    }

    const updated: Product = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined
        ? { slug: input.slug.trim().toLowerCase() }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.brandId !== undefined
        ? { brandId: input.brandId ?? undefined }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    this.productsById.set(id, updated);
    return updated;
  }

  async brandExists(storeId: string, id: string): Promise<boolean> {
    return this.brandsByStore.get(storeId)?.has(id) ?? false;
  }
}
