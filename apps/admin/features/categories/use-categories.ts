"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { categoriesQueryKey } from "@/features/categories/category-query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { listCategories } from "@/services/categories.service";

export interface CategoryListFilters {
  readonly search: string;
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_FILTERS: CategoryListFilters = {
  search: "",
  page: 1,
  pageSize: 20,
};

export function useCategories(storeId: string | null) {
  const [filters, setFilters] = useState<CategoryListFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const query = useQuery({
    queryKey: categoriesQueryKey(storeId ?? "", {
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
      return listCategories({
        storeId,
        page: filters.page,
        limit: filters.pageSize,
        search: debouncedSearch || undefined,
      });
    },
  });

  function updateFilters(
    patch: Partial<CategoryListFilters>,
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
