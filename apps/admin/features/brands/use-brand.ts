"use client";

import { useQuery } from "@tanstack/react-query";

import { brandDetailQueryKey } from "@/features/brands/brand-query-keys";
import { getBrand } from "@/services/brands.service";

export function useBrand(storeId: string | null, brandId: string) {
  return useQuery({
    queryKey: brandDetailQueryKey(storeId ?? "", brandId),
    enabled: Boolean(storeId && brandId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getBrand(brandId, { storeId });
    },
  });
}
