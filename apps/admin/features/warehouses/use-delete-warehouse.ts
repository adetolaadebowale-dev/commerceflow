"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { warehousesListRootKey } from "@/features/warehouses/warehouse-query-keys";
import { deleteWarehouse } from "@/services/warehouses.service";

export function useDeleteWarehouse(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return deleteWarehouse(id, { storeId });
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
