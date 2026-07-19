import type {
  ListBrandsParams,
  ListCategoriesParams,
  ListProductsParams,
} from "@commerceflow/api-client";
import type {
  Brand,
  CatalogueListResult,
  Category,
  Product,
} from "@commerceflow/types";

import {
  catalogueClient,
  toAdminApiError,
} from "@/services/catalogue-client";

export type ListProductsQuery = ListProductsParams;

export async function listProducts(
  params: ListProductsQuery,
): Promise<CatalogueListResult<Product>> {
  try {
    return await catalogueClient.listProducts(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listBrands(
  params: ListBrandsParams,
): Promise<CatalogueListResult<Brand>> {
  try {
    return await catalogueClient.listBrands(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
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
