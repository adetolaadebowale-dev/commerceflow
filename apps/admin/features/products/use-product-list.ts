"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ProductStatus } from "@commerceflow/types";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  listBrands,
  listCategories,
  listProducts,
} from "@/services/products.service";
import { mapProductToListRow } from "@/features/products/product-list-mappers";

export const PRODUCT_PAGE_SIZES = [10, 20, 50] as const;

export interface ProductListFilters {
  readonly search: string;
  readonly status: ProductStatus | "all";
  readonly brandId: string | "all";
  readonly categoryId: string | "all";
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_FILTERS: ProductListFilters = {
  search: "",
  status: "all",
  brandId: "all",
  categoryId: "all",
  page: 1,
  pageSize: 20,
};

export function useProductList(storeId: string | null) {
  const [filters, setFilters] = useState<ProductListFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

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

  const productsQuery = useQuery({
    queryKey: [
      "products",
      storeId,
      debouncedSearch,
      filters.status,
      filters.brandId,
      filters.categoryId,
      filters.page,
      filters.pageSize,
    ],
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }

      return listProducts({
        storeId,
        page: filters.page,
        limit: filters.pageSize,
        search: debouncedSearch || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        brandId: filters.brandId === "all" ? undefined : filters.brandId,
        categoryId:
          filters.categoryId === "all" ? undefined : filters.categoryId,
      });
    },
  });

  const brandsById = useMemo(() => {
    const map = new Map(
      (brandsQuery.data?.items ?? []).map((brand) => [brand.id, brand]),
    );
    return map;
  }, [brandsQuery.data?.items]);

  const categoriesById = useMemo(() => {
    const map = new Map(
      (categoriesQuery.data?.items ?? []).map((category) => [
        category.id,
        category,
      ]),
    );
    return map;
  }, [categoriesQuery.data?.items]);

  const rows = useMemo(() => {
    return (productsQuery.data?.items ?? []).map((product) =>
      mapProductToListRow(product, brandsById, categoriesById),
    );
  }, [productsQuery.data?.items, brandsById, categoriesById]);

  function updateFilters(
    patch: Partial<ProductListFilters>,
    options?: { resetPage?: boolean },
  ) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page:
        options?.resetPage === false
          ? (patch.page ?? current.page)
          : (patch.page ?? 1),
    }));
  }

  return {
    filters,
    setSearch: (search: string) => updateFilters({ search }),
    setStatus: (status: ProductListFilters["status"]) =>
      updateFilters({ status }),
    setBrandId: (brandId: ProductListFilters["brandId"]) =>
      updateFilters({ brandId }),
    setCategoryId: (categoryId: ProductListFilters["categoryId"]) =>
      updateFilters({ categoryId }),
    setPage: (page: number) => updateFilters({ page }, { resetPage: false }),
    setPageSize: (pageSize: number) => updateFilters({ pageSize, page: 1 }),
    brands: brandsQuery.data?.items ?? [],
    categories: categoriesQuery.data?.items ?? [],
    rows,
    total: productsQuery.data?.total ?? 0,
    totalPages: productsQuery.data?.totalPages ?? 0,
    isLoading: productsQuery.isLoading,
    isFetching: productsQuery.isFetching,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
  };
}
