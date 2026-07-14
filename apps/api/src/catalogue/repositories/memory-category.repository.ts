import {
  buildCatalogueListResult,
  type Category,
  type CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "@commerceflow/validation";

import type { CategoryRepository } from "./category.repository";

export class MemoryCategoryRepository implements CategoryRepository {
  private readonly categoriesById = new Map<string, Category>();
  private readonly deletedIds = new Set<string>();

  /** Marks a category as soft-deleted for test scenarios. */
  softDelete(id: string): void {
    this.deletedIds.add(id);
  }

  async findById(storeId: string, id: string): Promise<Category | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const category = this.categoriesById.get(id);
    return category?.storeId === storeId ? category : null;
  }

  async findBySlug(storeId: string, slug: string): Promise<Category | null> {
    const normalizedSlug = slug.trim().toLowerCase();

    for (const category of this.categoriesById.values()) {
      if (
        category.storeId === storeId &&
        category.slug === normalizedSlug &&
        !this.deletedIds.has(category.id)
      ) {
        return category;
      }
    }

    return null;
  }

  async list(
    query: ListCategoriesQuery,
  ): Promise<CatalogueListResult<Category>> {
    let items = [...this.categoriesById.values()].filter(
      (category) =>
        category.storeId === query.storeId &&
        !this.deletedIds.has(category.id),
    );

    if (query.parentId) {
      items = items.filter((category) => category.parentId === query.parentId);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (category) =>
          category.name.toLowerCase().includes(search) ||
          category.slug.includes(search),
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

  async create(input: CreateCategoryInput): Promise<Category> {
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim(),
      parentId: input.parentId,
      createdAt: now,
      updatedAt: now,
    };

    this.categoriesById.set(category.id, category);
    return category;
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    const existing = await this.findById(storeId, id);

    if (!existing) {
      throw new Error(`Category not found: ${id}`);
    }

    const updated: Category = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined
        ? { slug: input.slug.trim().toLowerCase() }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() }
        : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.categoriesById.set(id, updated);
    return updated;
  }
}
