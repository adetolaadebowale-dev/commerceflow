"use client";

import { useQuery } from "@tanstack/react-query";

import { productVariantsQueryKey } from "@/features/products/variants/variant-query-keys";
import { listProductVariants } from "@/services/products.service";

export function useProductVariants(storeId: string | null, productId: string) {
  return useQuery({
    queryKey: productVariantsQueryKey(storeId ?? "", productId),
    enabled: Boolean(storeId && productId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listProductVariants(productId, { storeId });
    },
  });
}
