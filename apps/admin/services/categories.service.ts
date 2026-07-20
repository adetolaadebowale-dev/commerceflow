import type {
  CreateCategoryRequest,
  ListCategoriesParams,
  UpdateCategoryRequest,
} from "@commerceflow/api-client";
import type { CatalogueListResult, Category } from "@commerceflow/types";

import {
  catalogueClient,
  toAdminApiError,
} from "@/services/catalogue-client";

export interface StoreScopedParams {
  readonly storeId: string;
}

export async function listCategories(
  params: ListCategoriesParams,
): Promise<CatalogueListResult<Category>> {
  try {
    return await catalogueClient.listCategories(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getCategory(
  id: string,
  params: StoreScopedParams,
): Promise<Category> {
  try {
    const result = await catalogueClient.getCategory(id, params);
    return result.category;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createCategory(
  input: CreateCategoryRequest,
): Promise<Category> {
  try {
    const result = await catalogueClient.createCategory(input);
    return result.category;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryRequest,
  params: StoreScopedParams,
): Promise<Category> {
  try {
    const result = await catalogueClient.updateCategory(id, input, params);
    return result.category;
  } catch (error) {
    throw toAdminApiError(error);
  }
}
