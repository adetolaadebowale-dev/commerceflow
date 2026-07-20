"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  brandDetailQueryKey,
  brandsListRootKey,
  brandsProductFiltersQueryKey,
} from "@/features/brands/brand-query-keys";
import { deactivateBrand } from "@/services/brands.service";

/** Soft-deactivates a brand via DELETE (deletedAt). No reactivate API exists. */
export function useDeactivateBrand(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return deactivateBrand(id, { storeId });
    },
    onSuccess: (_brand, id) => {
      if (!storeId) {
        return;
      }
      queryClient.removeQueries({
        queryKey: brandDetailQueryKey(storeId, id),
      });
      void queryClient.invalidateQueries({
        queryKey: brandsListRootKey(storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: brandsProductFiltersQueryKey(storeId),
      });
    },
  });
}
