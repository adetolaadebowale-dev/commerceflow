"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { WarehouseStatus } from "@commerceflow/types";
import { useState } from "react";

import { warehousesQueryKey } from "@/features/warehouses/warehouse-query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { listWarehouses } from "@/services/warehouses.service";

export const WAREHOUSE_PAGE_SIZES = [10, 20, 50] as const;

export interface WarehouseListFilters {
  readonly search: string;
  readonly status: WarehouseStatus | "all";
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_FILTERS: WarehouseListFilters = {
  search: "",
  status: "all",
  page: 1,
  pageSize: 20,
};

export function useWarehouses(storeId: string | null) {
  const [filters, setFilters] = useState<WarehouseListFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const query = useQuery({
    queryKey: warehousesQueryKey(storeId ?? "", {
      search: debouncedSearch,
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }

      return listWarehouses({
        storeId,
        page: filters.page,
        limit: filters.pageSize,
        search: debouncedSearch || undefined,
        status: filters.status === "all" ? undefined : filters.status,
      });
    },
  });

  function updateFilters(
    patch: Partial<WarehouseListFilters>,
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
    setStatus: (status: WarehouseListFilters["status"]) =>
      updateFilters({ status }),
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
