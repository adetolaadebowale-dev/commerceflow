"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { ProductMedia, ProductMediaListResponse } from "@commerceflow/types";

import { productMediaQueryKey } from "@/features/products/media/media-query-keys";
import { reorderProductMedia } from "@/services/products.service";

function applyOptimisticOrder(
  queryClient: QueryClient,
  storeId: string,
  productId: string,
  orderedMediaIds: readonly string[],
): ProductMediaListResponse | undefined {
  const key = productMediaQueryKey(storeId, productId);
  const previous = queryClient.getQueryData<ProductMediaListResponse>(key);
  if (!previous) {
    return undefined;
  }

  const byId = new Map(previous.items.map((item) => [item.id, item]));
  const items: ProductMedia[] = [];
  for (const [index, id] of orderedMediaIds.entries()) {
    const media = byId.get(id);
    if (media) {
      items.push({ ...media, sortOrder: index });
    }
  }

  queryClient.setQueryData<ProductMediaListResponse>(key, { items });
  return previous;
}

export function useReorderProductMedia(
  storeId: string | null,
  productId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedMediaIds: readonly string[]) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return reorderProductMedia(
        productId,
        { orderedMediaIds },
        { storeId },
      );
    },
    onMutate: async (orderedMediaIds) => {
      if (!storeId) {
        return { previous: undefined };
      }
      const key = productMediaQueryKey(storeId, productId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = applyOptimisticOrder(
        queryClient,
        storeId,
        productId,
        orderedMediaIds,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!storeId || !context?.previous) {
        return;
      }
      queryClient.setQueryData(
        productMediaQueryKey(storeId, productId),
        context.previous,
      );
    },
    onSuccess: (data) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(productMediaQueryKey(storeId, productId), data);
    },
  });
}
