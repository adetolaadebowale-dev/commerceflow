import {
  buildCatalogueListResult,
  type Brand,
  type CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateBrandInput,
  ListBrandsQuery,
  UpdateBrandInput,
} from "@commerceflow/validation";

import type { BrandRepository } from "./brand.repository";

export class MemoryBrandRepository implements BrandRepository {
  private readonly brandsById = new Map<string, Brand>();
  private readonly deletedIds = new Set<string>();

  async findById(storeId: string, id: string): Promise<Brand | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const brand = this.brandsById.get(id);
    return brand?.storeId === storeId ? brand : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Brand | null> {
    const normalizedSlug = slug.trim().toLowerCase();

    for (const brand of this.brandsById.values()) {
      if (
        brand.storeId === storeId &&
        brand.slug === normalizedSlug &&
        !this.deletedIds.has(brand.id)
      ) {
        return brand;
      }
    }

    return null;
  }

  async list(query: ListBrandsQuery): Promise<CatalogueListResult<Brand>> {
    let items = [...this.brandsById.values()].filter(
      (brand) =>
        brand.storeId === query.storeId && !this.deletedIds.has(brand.id),
    );

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (brand) =>
          brand.name.toLowerCase().includes(search) ||
          brand.slug.includes(search),
      );
    }

    items.sort((left, right) => left.name.localeCompare(right.name));

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

  async create(input: CreateBrandInput): Promise<Brand> {
    const now = new Date().toISOString();
    const brand: Brand = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.brandsById.set(brand.id, brand);
    return brand;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateBrandInput,
  ): Promise<Brand> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Brand not found: ${id}`);
    }

    const updated: Brand = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined
        ? { slug: input.slug.trim().toLowerCase() }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    this.brandsById.set(id, updated);
    return updated;
  }

  async softDelete(storeId: string, id: string): Promise<Brand> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Brand not found: ${id}`);
    }

    this.deletedIds.add(id);
    return existing;
  }
}
