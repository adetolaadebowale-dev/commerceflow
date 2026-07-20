"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateBrandRequest } from "@commerceflow/api-client";

import {
  brandDetailQueryKey,
  brandsListRootKey,
  brandsProductFiltersQueryKey,
} from "@/features/brands/brand-query-keys";
import { createBrand } from "@/services/brands.service";

function invalidateBrandQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  storeId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: brandsListRootKey(storeId),
  });
  void queryClient.invalidateQueries({
    queryKey: brandsProductFiltersQueryKey(storeId),
  });
}

export function useCreateBrand(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateBrandRequest, "storeId">) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createBrand({ ...input, storeId });
    },
    onSuccess: (brand) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        brandDetailQueryKey(storeId, brand.id),
        brand,
      );
      invalidateBrandQueries(queryClient, storeId);
    },
  });
}
