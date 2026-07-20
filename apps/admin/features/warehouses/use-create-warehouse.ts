"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateWarehouseRequest } from "@commerceflow/api-client";

import { warehousesListRootKey } from "@/features/warehouses/warehouse-query-keys";
import { createWarehouse } from "@/services/warehouses.service";

export function useCreateWarehouse(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateWarehouseRequest, "storeId">) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return createWarehouse({ ...input, storeId });
    },
    onSuccess: () => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: warehousesListRootKey(storeId),
      });
    },
  });
}
