"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesProductFiltersQueryKey } from "@/features/categories/category-query-keys";
import { listCategories } from "@/services/categories.service";

/** Full parent-picker list (shared with product filter cache key family). */
export function useCategoryOptions(
  storeId: string | null,
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: [...categoriesProductFiltersQueryKey(storeId ?? ""), "options"],
    enabled: Boolean(storeId) && (options?.enabled ?? true),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listCategories({ storeId, page: 1, limit: 100 });
    },
  });
}
