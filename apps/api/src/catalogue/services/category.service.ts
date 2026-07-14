import type { Category, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "@commerceflow/validation";

import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import {
  getCategoryRepository,
  type CategoryRepository,
} from "../repositories";
import { assertNoParentCycle } from "./category-cycle";

export interface CategoryServiceDependencies {
  readonly categoryRepository?: CategoryRepository;
}

export class CategoryService {
  private readonly categoryRepository: CategoryRepository;

  constructor(dependencies: CategoryServiceDependencies = {}) {
    this.categoryRepository =
      dependencies.categoryRepository ?? getCategoryRepository();
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findBySlug(
      input.storeId,
      input.slug,
    );

    if (existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
        "A category with this slug already exists",
        409,
      );
    }

    if (input.parentId) {
      const parent = await this.categoryRepository.findById(
        input.storeId,
        input.parentId,
      );

      if (!parent) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
          "Parent category not found",
          404,
        );
      }
    }

    return this.categoryRepository.create(input);
  }

  async updateCategory(
    storeId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    const category = await this.categoryRepository.findById(storeId, id);

    if (!category) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Category not found",
        404,
      );
    }

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.categoryRepository.findBySlug(
        storeId,
        input.slug,
      );

      if (existing) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A category with this slug already exists",
          409,
        );
      }
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
          "A category cannot be its own parent",
          400,
        );
      }

      const parent = await this.categoryRepository.findById(
        storeId,
        input.parentId,
      );

      if (!parent) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
          "Parent category not found",
          404,
        );
      }

      await assertNoParentCycle(
        this.categoryRepository,
        storeId,
        id,
        input.parentId,
      );
    }

    try {
      return await this.categoryRepository.update(storeId, id, input);
    } catch {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Category not found",
        404,
      );
    }
  }

  async getCategory(storeId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(storeId, id);

    if (!category) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Category not found",
        404,
      );
    }

    return category;
  }

  async listCategories(
    query: ListCategoriesQuery,
  ): Promise<CatalogueListResult<Category>> {
    return this.categoryRepository.list(query);
  }
}

export const categoryService = new CategoryService();
