"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateInventoryAdjustmentInput } from "@commerceflow/validation";

import {
  inventoryItemsQueryKey,
  inventorySummaryQueryKey,
} from "@/features/inventory/inventory-query-keys";
import { createInventoryAdjustment } from "@/services/inventory.service";

export function useAdjustInventory(
  storeId: string | null,
  productId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<CreateInventoryAdjustmentInput, "storeId">,
    ) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createInventoryAdjustment({ ...input, storeId });
    },
    onSuccess: (result) => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKey(storeId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: inventorySummaryQueryKey(storeId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["inventory-history", storeId, result.adjustment.inventoryItemId],
      });
    },
  });
}
