"use client";

import { useQuery } from "@tanstack/react-query";

import { productDetailQueryKey } from "@/features/products/media/media-query-keys";
import { getProduct, listBrands, listCategories } from "@/services/products.service";

export function useProduct(storeId: string | null, productId: string) {
  const productQuery = useQuery({
    queryKey: productDetailQueryKey(storeId ?? "", productId),
    enabled: Boolean(storeId && productId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getProduct(productId, { storeId });
    },
  });

  const brandsQuery = useQuery({
    queryKey: ["brands", "product-filters", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listBrands({ storeId, page: 1, limit: 100 });
    },
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "product-filters", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listCategories({ storeId, page: 1, limit: 100 });
    },
    staleTime: 60_000,
  });

  return {
    product: productQuery.data,
    brands: brandsQuery.data?.items ?? [],
    categories: categoriesQuery.data?.items ?? [],
    isLoading:
      productQuery.isLoading ||
      brandsQuery.isLoading ||
      categoriesQuery.isLoading,
    isProductLoading: productQuery.isLoading,
    isError: productQuery.isError,
    isFiltersError: brandsQuery.isError || categoriesQuery.isError,
    error: productQuery.error,
    refetch: productQuery.refetch,
  };
}

/** @deprecated Prefer useProduct */
export function useProductDetail(storeId: string | null, productId: string) {
  const result = useProduct(storeId, productId);
  const brandName =
    result.product?.brandId != null
      ? result.brands.find((brand) => brand.id === result.product?.brandId)
          ?.name
      : undefined;
  const categoryName = result.product
    ? result.categories.find(
        (category) => category.id === result.product?.categoryId,
      )?.name
    : undefined;

  return {
    product: result.product,
    brandName: brandName ?? null,
    categoryName: categoryName ?? null,
    isLoading: result.isProductLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}
