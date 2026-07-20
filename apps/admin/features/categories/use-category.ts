"use client";

import { useQuery } from "@tanstack/react-query";

import { categoryDetailQueryKey } from "@/features/categories/category-query-keys";
import { getCategory } from "@/services/categories.service";

export function useCategory(storeId: string | null, categoryId: string) {
  return useQuery({
    queryKey: categoryDetailQueryKey(storeId ?? "", categoryId),
    enabled: Boolean(storeId && categoryId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getCategory(categoryId, { storeId });
    },
  });
}
