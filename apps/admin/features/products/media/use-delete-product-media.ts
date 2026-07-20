"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productMediaQueryKey } from "@/features/products/media/media-query-keys";
import { deleteProductMedia } from "@/services/products.service";

export function useDeleteProductMedia(
  storeId: string | null,
  productId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return deleteProductMedia(productId, mediaId, { storeId });
    },
    onSuccess: async () => {
      if (!storeId) {
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productMediaQueryKey(storeId, productId),
      });
    },
  });
}
