"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductVariant, ProductVariantListResponse } from "@commerceflow/types";

import { productDetailQueryKey } from "@/features/products/media/media-query-keys";
import { productVariantsQueryKey } from "@/features/products/variants/variant-query-keys";
import { deleteProductVariant } from "@/services/products.service";

export function useDeleteVariant(storeId: string | null, productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return deleteProductVariant(productId, variantId, { storeId });
    },
    onMutate: async (variantId) => {
      if (!storeId) {
        return {};
      }
      const key = productVariantsQueryKey(storeId, productId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProductVariantListResponse>(key);
      queryClient.setQueryData<ProductVariantListResponse>(key, (current) => ({
        items: (current?.items ?? []).filter((item) => item.id !== variantId),
      }));
      return { previous };
    },
    onError: (_error, _variantId, context) => {
      if (!storeId || !context?.previous) {
        return;
      }
      queryClient.setQueryData(
        productVariantsQueryKey(storeId, productId),
        context.previous,
      );
    },
    onSuccess: (_variant: ProductVariant) => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(storeId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["products", storeId],
      });
    },
    onSettled: () => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: productVariantsQueryKey(storeId, productId),
      });
    },
  });
}
