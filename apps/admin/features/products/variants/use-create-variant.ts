"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductVariantRequest } from "@commerceflow/api-client";
import type { ProductVariant, ProductVariantListResponse } from "@commerceflow/types";

import { productDetailQueryKey } from "@/features/products/media/media-query-keys";
import { productVariantsQueryKey } from "@/features/products/variants/variant-query-keys";
import { createProductVariant } from "@/services/products.service";

export function useCreateVariant(storeId: string | null, productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductVariantRequest) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createProductVariant(productId, input, { storeId });
    },
    onSuccess: (variant: ProductVariant) => {
      if (!storeId) {
        return;
      }
      const key = productVariantsQueryKey(storeId, productId);
      queryClient.setQueryData<ProductVariantListResponse>(key, (current) => ({
        items: [...(current?.items ?? []), variant],
      }));
      void queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(storeId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["products", storeId],
      });
    },
  });
}
