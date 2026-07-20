"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  orderDetailQueryKey,
  orderReservationsQueryKey,
  ordersListRootKey,
} from "@/features/orders/order-query-keys";
import { fulfillOrder } from "@/services/orders.service";

export function useFulfillOrder(storeId: string | null, orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return fulfillOrder(orderId, { storeId });
    },
    onSuccess: (result) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        orderDetailQueryKey(storeId, orderId),
        result.order,
      );
      queryClient.setQueryData(
        orderReservationsQueryKey(storeId, orderId),
        result.reservations,
      );
      void queryClient.invalidateQueries({
        queryKey: ordersListRootKey(storeId),
      });
    },
  });
}
