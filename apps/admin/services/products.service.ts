import type {
  CreateProductRequest,
  CreateProductVariantRequest,
  ListBrandsParams,
  ListCategoriesParams,
  ListProductsParams,
  ReorderProductMediaClientRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UploadProductMediaRequest,
} from "@commerceflow/api-client";
import type {
  Brand,
  CatalogueListResult,
  Category,
  Product,
  ProductMedia,
  ProductMediaListResponse,
  ProductVariant,
  ProductVariantListResponse,
} from "@commerceflow/types";

import { API_BASE_URL } from "@/services/api-client";
import {
  catalogueClient,
  toAdminApiError,
} from "@/services/catalogue-client";
import { getStoredAccessToken } from "@/services/token-storage";
import { AdminApiError } from "@/types/api";

export type ListProductsQuery = ListProductsParams;

export interface StoreScopedParams {
  readonly storeId: string;
}

export async function listProducts(
  params: ListProductsQuery,
): Promise<CatalogueListResult<Product>> {
  try {
    return await catalogueClient.listProducts(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getProduct(
  id: string,
  params: StoreScopedParams,
): Promise<Product> {
  try {
    const result = await catalogueClient.getProduct(id, params);
    return result.product;
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

export async function createProduct(
  input: CreateProductRequest,
): Promise<Product> {
  try {
    const result = await catalogueClient.createProduct(input);
    return result.product;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateProduct(
  id: string,
  input: UpdateProductRequest,
  params: StoreScopedParams,
): Promise<Product> {
  try {
    const result = await catalogueClient.updateProduct(id, input, params);
    return result.product;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listProductMedia(
  productId: string,
  params: StoreScopedParams,
): Promise<ProductMediaListResponse> {
  try {
    return await catalogueClient.listProductMedia(productId, params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function deleteProductMedia(
  productId: string,
  mediaId: string,
  params: StoreScopedParams,
): Promise<ProductMedia> {
  try {
    const result = await catalogueClient.deleteProductMedia(
      productId,
      mediaId,
      params,
    );
    return result.media;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function reorderProductMedia(
  productId: string,
  input: ReorderProductMediaClientRequest,
  params: StoreScopedParams,
): Promise<ProductMediaListResponse> {
  try {
    return await catalogueClient.reorderProductMedia(productId, input, params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listProductVariants(
  productId: string,
  params: StoreScopedParams,
): Promise<ProductVariantListResponse> {
  try {
    return await catalogueClient.listProductVariants(productId, params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createProductVariant(
  productId: string,
  input: CreateProductVariantRequest,
  params: StoreScopedParams,
): Promise<ProductVariant> {
  try {
    const result = await catalogueClient.createProductVariant(
      productId,
      input,
      params,
    );
    return result.variant;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  input: UpdateProductVariantRequest,
  params: StoreScopedParams,
): Promise<ProductVariant> {
  try {
    const result = await catalogueClient.updateProductVariant(
      productId,
      variantId,
      input,
      params,
    );
    return result.variant;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
  params: StoreScopedParams,
): Promise<ProductVariant> {
  try {
    const result = await catalogueClient.deleteProductVariant(
      productId,
      variantId,
      params,
    );
    return result.variant;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export interface UploadProductMediaOptions {
  readonly onProgress?: (percent: number) => void;
}

/**
 * Multipart upload with optional XHR progress. Uses the same API contract as
 * `catalogueClient.uploadProductMedia`.
 */
export async function uploadProductMedia(
  productId: string,
  input: UploadProductMediaRequest,
  params: StoreScopedParams,
  options: UploadProductMediaOptions = {},
): Promise<ProductMedia> {
  if (!options.onProgress) {
    try {
      const result = await catalogueClient.uploadProductMedia(
        productId,
        input,
        params,
      );
      return result.media;
    } catch (error) {
      throw toAdminApiError(error);
    }
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", input.file, input.filename ?? "upload");
    if (input.altText !== undefined) {
      formData.append("altText", input.altText);
    }

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${API_BASE_URL}/api/products/${productId}/media?storeId=${encodeURIComponent(params.storeId)}`,
    );
    xhr.setRequestHeader("Accept", "application/json");

    const accessToken = getStoredAccessToken();
    if (accessToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      options.onProgress?.(percent);
    };

    xhr.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(xhr.responseText) as unknown;
      } catch {
        reject(
          new AdminApiError(
            "UNKNOWN_ERROR",
            "Upload failed with an invalid response",
            xhr.status || 500,
          ),
        );
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const data = payload as { data?: { media?: ProductMedia } };
        if (data.data?.media) {
          options.onProgress?.(100);
          resolve(data.data.media);
          return;
        }
        reject(
          new AdminApiError(
            "UNKNOWN_ERROR",
            "Upload succeeded without media payload",
            xhr.status,
          ),
        );
        return;
      }

      const error = payload as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      reject(
        new AdminApiError(
          error.error?.code ?? "UNKNOWN_ERROR",
          error.error?.message ?? "Upload failed",
          xhr.status,
          error.error?.details,
        ),
      );
    };

    xhr.onerror = () => {
      reject(
        new AdminApiError("NETWORK_ERROR", "Network error during upload", 0),
      );
    };

    xhr.send(formData);
  });
}
