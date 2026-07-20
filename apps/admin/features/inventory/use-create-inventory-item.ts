"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateInventoryItemRequest } from "@commerceflow/api-client";

import {
  inventoryItemsQueryKey,
  inventorySummaryQueryKey,
} from "@/features/inventory/inventory-query-keys";
import { createInventoryItem } from "@/services/inventory.service";

export function useCreateInventoryItem(
  storeId: string | null,
  productId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<CreateInventoryItemRequest, "storeId">,
    ) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createInventoryItem({ ...input, storeId });
    },
    onSuccess: () => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKey(storeId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: inventorySummaryQueryKey(storeId, productId),
      });
    },
  });
}
