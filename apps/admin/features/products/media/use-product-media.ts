"use client";

import { useQuery } from "@tanstack/react-query";

import { productMediaQueryKey } from "@/features/products/media/media-query-keys";
import { listProductMedia } from "@/services/products.service";

export function useProductMedia(storeId: string | null, productId: string) {
  return useQuery({
    queryKey: productMediaQueryKey(storeId ?? "", productId),
    enabled: Boolean(storeId && productId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listProductMedia(productId, { storeId });
    },
  });
}
