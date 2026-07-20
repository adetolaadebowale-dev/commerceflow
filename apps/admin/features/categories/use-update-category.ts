"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateCategoryRequest } from "@commerceflow/api-client";

import {
  categoriesListRootKey,
  categoriesProductFiltersQueryKey,
  categoryDetailQueryKey,
} from "@/features/categories/category-query-keys";
import { updateCategory } from "@/services/categories.service";

export function useUpdateCategory(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input: UpdateCategoryRequest;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateCategory(id, input, { storeId });
    },
    onSuccess: (category) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        categoryDetailQueryKey(storeId, category.id),
        category,
      );
      void queryClient.invalidateQueries({
        queryKey: categoriesListRootKey(storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: categoriesProductFiltersQueryKey(storeId),
      });
    },
  });
}
