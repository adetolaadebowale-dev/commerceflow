"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { brandsQueryKey } from "@/features/brands/brand-query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { listBrands } from "@/services/brands.service";

export const BRAND_PAGE_SIZES = [10, 20, 50] as const;

export interface BrandListFilters {
  readonly search: string;
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_FILTERS: BrandListFilters = {
  search: "",
  page: 1,
  pageSize: 20,
};

export function useBrands(storeId: string | null) {
  const [filters, setFilters] = useState<BrandListFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const query = useQuery({
    queryKey: brandsQueryKey(storeId ?? "", {
      search: debouncedSearch,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listBrands({
        storeId,
        page: filters.page,
        limit: filters.pageSize,
        search: debouncedSearch || undefined,
      });
    },
  });

  function updateFilters(
    patch: Partial<BrandListFilters>,
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
    setPage: (page: number) => updateFilters({ page }, { resetPage: false }),
    setPageSize: (pageSize: number) => updateFilters({ pageSize, page: 1 }),
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
