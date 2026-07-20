"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProductRequest } from "@commerceflow/api-client";
import type { Product } from "@commerceflow/types";

import { productDetailQueryKey } from "@/features/products/media/media-query-keys";
import { updateProduct } from "@/services/products.service";

export function useUpdateProduct(storeId: string | null, productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductRequest) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateProduct(productId, input, { storeId });
    },
    onSuccess: (product: Product) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        productDetailQueryKey(storeId, productId),
        product,
      );
      void queryClient.invalidateQueries({
        queryKey: ["products", storeId],
      });
    },
  });
}
