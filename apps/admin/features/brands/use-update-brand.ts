"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateBrandRequest } from "@commerceflow/api-client";

import {
  brandDetailQueryKey,
  brandsListRootKey,
  brandsProductFiltersQueryKey,
} from "@/features/brands/brand-query-keys";
import { updateBrand } from "@/services/brands.service";

export function useUpdateBrand(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input: UpdateBrandRequest;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateBrand(id, input, { storeId });
    },
    onSuccess: (brand) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        brandDetailQueryKey(storeId, brand.id),
        brand,
      );
      void queryClient.invalidateQueries({
        queryKey: brandsListRootKey(storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: brandsProductFiltersQueryKey(storeId),
      });
    },
  });
}
