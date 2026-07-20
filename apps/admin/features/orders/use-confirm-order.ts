"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  orderDetailQueryKey,
  ordersListRootKey,
} from "@/features/orders/order-query-keys";
import { confirmOrder } from "@/services/orders.service";

export function useConfirmOrder(storeId: string | null, orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return confirmOrder(orderId, { storeId });
    },
    onSuccess: (order) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(orderDetailQueryKey(storeId, orderId), order);
      void queryClient.invalidateQueries({
        queryKey: ordersListRootKey(storeId),
      });
    },
  });
}
