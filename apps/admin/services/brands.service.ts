import type {
  CreateBrandRequest,
  ListBrandsParams,
  UpdateBrandRequest,
} from "@commerceflow/api-client";
import type { Brand, CatalogueListResult } from "@commerceflow/types";

import {
  catalogueClient,
  toAdminApiError,
} from "@/services/catalogue-client";

export interface StoreScopedParams {
  readonly storeId: string;
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

export async function getBrand(
  id: string,
  params: StoreScopedParams,
): Promise<Brand> {
  try {
    const result = await catalogueClient.getBrand(id, params);
    return result.brand;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createBrand(
  input: CreateBrandRequest,
): Promise<Brand> {
  try {
    const result = await catalogueClient.createBrand(input);
    return result.brand;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateBrand(
  id: string,
  input: UpdateBrandRequest,
  params: StoreScopedParams,
): Promise<Brand> {
  try {
    const result = await catalogueClient.updateBrand(id, input, params);
    return result.brand;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/**
 * Soft-deactivates a brand (sets deletedAt). There is no hard delete or reactivate API.
 */
export async function deactivateBrand(
  id: string,
  params: StoreScopedParams,
): Promise<Brand> {
  try {
    const result = await catalogueClient.deleteBrand(id, params);
    return result.brand;
  } catch (error) {
    throw toAdminApiError(error);
  }
}
