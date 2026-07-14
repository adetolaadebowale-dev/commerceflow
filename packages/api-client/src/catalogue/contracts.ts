import type {
  Category,
  Product,
  CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateCategoryInput,
  CreateProductInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /categories */
export type CreateCategoryRequest = CreateCategoryInput;
export type CreateCategoryResponse = ApiSuccessResponse<{ category: Category }>;

/** PATCH /categories/:id */
export type UpdateCategoryRequest = UpdateCategoryInput;
export type UpdateCategoryResponse = ApiSuccessResponse<{ category: Category }>;

/** GET /categories/:id */
export type GetCategoryResponse = ApiSuccessResponse<{ category: Category }>;

/** GET /categories */
export type ListCategoriesResponse = ApiSuccessResponse<
  CatalogueListResult<Category>
>;

/** POST /products */
export type CreateProductRequest = CreateProductInput;
export type CreateProductResponse = ApiSuccessResponse<{ product: Product }>;

/** PATCH /products/:id */
export type UpdateProductRequest = UpdateProductInput;
export type UpdateProductResponse = ApiSuccessResponse<{ product: Product }>;

/** GET /products/:id */
export type GetProductResponse = ApiSuccessResponse<{ product: Product }>;

/** GET /products */
export type ListProductsResponse = ApiSuccessResponse<
  CatalogueListResult<Product>
>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListCategoriesParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly parentId?: string;
  readonly search?: string;
}

export interface ListProductsParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly categoryId?: string;
  readonly brandId?: string;
  readonly status?: Product["status"];
  readonly search?: string;
}
