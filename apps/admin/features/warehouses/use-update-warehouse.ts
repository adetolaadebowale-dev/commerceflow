"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateWarehouseRequest } from "@commerceflow/api-client";

import { warehousesListRootKey } from "@/features/warehouses/warehouse-query-keys";
import { updateWarehouse } from "@/services/warehouses.service";

export function useUpdateWarehouse(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      readonly id: string;
      readonly input: UpdateWarehouseRequest;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateWarehouse(id, input, { storeId });
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
