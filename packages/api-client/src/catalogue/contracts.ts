import type {
  Brand,
  Category,
  Product,
  ProductMedia,
  ProductMediaListResponse,
  CatalogueListResult,
  CreateProductMediaRequest,
  ReorderProductMediaRequest,
} from "@commerceflow/types";
import type {
  CreateBrandInput,
  CreateCategoryInput,
  CreateProductInput,
  UpdateBrandInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /brands */
export type CreateBrandRequest = CreateBrandInput;
export type CreateBrandResponse = ApiSuccessResponse<{ brand: Brand }>;

/** PATCH /brands/:id */
export type UpdateBrandRequest = UpdateBrandInput;
export type UpdateBrandResponse = ApiSuccessResponse<{ brand: Brand }>;

/** GET /brands/:id */
export type GetBrandResponse = ApiSuccessResponse<{ brand: Brand }>;

/** DELETE /brands/:id */
export type DeleteBrandResponse = ApiSuccessResponse<{ brand: Brand }>;

/** GET /brands */
export type ListBrandsResponse = ApiSuccessResponse<
  CatalogueListResult<Brand>
>;

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

/** POST /products/:id/media */
export type UploadProductMediaRequest = CreateProductMediaRequest & {
  readonly file: Blob;
  readonly filename?: string;
};
export type UploadProductMediaResponse = ApiSuccessResponse<{
  media: ProductMedia;
}>;

/** GET /products/:id/media */
export type ListProductMediaResponse =
  ApiSuccessResponse<ProductMediaListResponse>;

/** DELETE /products/:id/media/:mediaId */
export type DeleteProductMediaResponse = ApiSuccessResponse<{
  media: ProductMedia;
}>;

/** PATCH /products/:id/media/order */
export type ReorderProductMediaClientRequest = ReorderProductMediaRequest;
export type ReorderProductMediaResponse =
  ApiSuccessResponse<ProductMediaListResponse>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListBrandsParams extends StoreScopedParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
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
