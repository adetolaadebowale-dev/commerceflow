"use client";

import { useQuery } from "@tanstack/react-query";

import { listWarehouses } from "@/services/warehouses.service";

export function activeWarehousesQueryKey(storeId: string) {
  return ["warehouses", storeId, "active"] as const;
}

/** Active warehouses for inventory initialization dialogs. */
export function useActiveWarehouses(storeId: string | null) {
  return useQuery({
    queryKey: activeWarehousesQueryKey(storeId ?? ""),
    enabled: Boolean(storeId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listWarehouses({
        storeId,
        page: 1,
        limit: 100,
        status: "active",
      });
    },
  });
}
