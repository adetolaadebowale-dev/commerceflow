"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProductVariantRequest } from "@commerceflow/api-client";
import type { ProductVariant, ProductVariantListResponse } from "@commerceflow/types";

import { productDetailQueryKey } from "@/features/products/media/media-query-keys";
import { productVariantsQueryKey } from "@/features/products/variants/variant-query-keys";
import { updateProductVariant } from "@/services/products.service";

export function useUpdateVariant(storeId: string | null, productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      input,
    }: {
      variantId: string;
      input: UpdateProductVariantRequest;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateProductVariant(productId, variantId, input, { storeId });
    },
    onSuccess: (variant: ProductVariant) => {
      if (!storeId) {
        return;
      }
      const key = productVariantsQueryKey(storeId, productId);
      queryClient.setQueryData<ProductVariantListResponse>(key, (current) => ({
        items: (current?.items ?? []).map((item) =>
          item.id === variant.id ? variant : item,
        ),
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
