"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  orderDetailQueryKey,
  orderReservationsQueryKey,
  ordersListRootKey,
} from "@/features/orders/order-query-keys";
import { cancelOrder } from "@/services/orders.service";

export function useCancelOrder(storeId: string | null, orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return cancelOrder(orderId, { storeId });
    },
    onSuccess: (order) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(orderDetailQueryKey(storeId, orderId), order);
      void queryClient.invalidateQueries({
        queryKey: ordersListRootKey(storeId),
      });
      void queryClient.invalidateQueries({
        queryKey: orderReservationsQueryKey(storeId, orderId),
      });
    },
  });
}
