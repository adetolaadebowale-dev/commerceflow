"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCategoryRequest } from "@commerceflow/api-client";

import {
  categoriesListRootKey,
  categoriesProductFiltersQueryKey,
  categoryDetailQueryKey,
} from "@/features/categories/category-query-keys";
import { createCategory } from "@/services/categories.service";

function invalidateCategoryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  storeId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: categoriesListRootKey(storeId),
  });
  void queryClient.invalidateQueries({
    queryKey: categoriesProductFiltersQueryKey(storeId),
  });
}

export function useCreateCategory(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateCategoryRequest, "storeId">) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createCategory({ ...input, storeId });
    },
    onSuccess: (category) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        categoryDetailQueryKey(storeId, category.id),
        category,
      );
      invalidateCategoryQueries(queryClient, storeId);
    },
  });
}
