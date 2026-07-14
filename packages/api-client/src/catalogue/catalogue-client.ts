import type {
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateProductRequest,
  DeleteBrandResponse,
  GetBrandResponse,
  GetCategoryResponse,
  GetProductResponse,
  ListBrandsParams,
  ListBrandsResponse,
  ListCategoriesParams,
  ListCategoriesResponse,
  ListProductsParams,
  ListProductsResponse,
  StoreScopedParams,
  UpdateBrandRequest,
  UpdateCategoryRequest,
  UpdateProductRequest,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params:
    | ListBrandsParams
    | ListCategoriesParams
    | ListProductsParams
    | StoreScopedParams,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface CatalogueClient {
  createBrand(input: CreateBrandRequest): Promise<GetBrandResponse["data"]>;
  updateBrand(
    id: string,
    input: UpdateBrandRequest,
    params: StoreScopedParams,
  ): Promise<GetBrandResponse["data"]>;
  getBrand(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetBrandResponse["data"]>;
  deleteBrand(
    id: string,
    params: StoreScopedParams,
  ): Promise<DeleteBrandResponse["data"]>;
  listBrands(params: ListBrandsParams): Promise<ListBrandsResponse["data"]>;
  createCategory(input: CreateCategoryRequest): Promise<GetCategoryResponse["data"]>;
  updateCategory(
    id: string,
    input: UpdateCategoryRequest,
    params: StoreScopedParams,
  ): Promise<GetCategoryResponse["data"]>;
  getCategory(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetCategoryResponse["data"]>;
  listCategories(
    params: ListCategoriesParams,
  ): Promise<ListCategoriesResponse["data"]>;
  createProduct(input: CreateProductRequest): Promise<GetProductResponse["data"]>;
  updateProduct(
    id: string,
    input: UpdateProductRequest,
    params: StoreScopedParams,
  ): Promise<GetProductResponse["data"]>;
  getProduct(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetProductResponse["data"]>;
  listProducts(params: ListProductsParams): Promise<ListProductsResponse["data"]>;
}

export function createCatalogueClient(config: ApiClientConfig): CatalogueClient {
  return {
    createBrand: (input) =>
      apiRequest<GetBrandResponse["data"]>(config, {
        method: "POST",
        path: "/api/brands",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateBrand: (id, input, params) =>
      apiRequest<GetBrandResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/brands/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getBrand: (id, params) =>
      apiRequest<GetBrandResponse["data"]>(config, {
        method: "GET",
        path: `/api/brands/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    deleteBrand: (id, params) =>
      apiRequest<DeleteBrandResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/brands/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listBrands: (params) =>
      apiRequest<ListBrandsResponse["data"]>(config, {
        method: "GET",
        path: `/api/brands${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createCategory: (input) =>
      apiRequest<GetCategoryResponse["data"]>(config, {
        method: "POST",
        path: "/api/categories",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateCategory: (id, input, params) =>
      apiRequest<GetCategoryResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/categories/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getCategory: (id, params) =>
      apiRequest<GetCategoryResponse["data"]>(config, {
        method: "GET",
        path: `/api/categories/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listCategories: (params) =>
      apiRequest<ListCategoriesResponse["data"]>(config, {
        method: "GET",
        path: `/api/categories${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createProduct: (input) =>
      apiRequest<GetProductResponse["data"]>(config, {
        method: "POST",
        path: "/api/products",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateProduct: (id, input, params) =>
      apiRequest<GetProductResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/products/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getProduct: (id, params) =>
      apiRequest<GetProductResponse["data"]>(config, {
        method: "GET",
        path: `/api/products/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listProducts: (params) =>
      apiRequest<ListProductsResponse["data"]>(config, {
        method: "GET",
        path: `/api/products${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
