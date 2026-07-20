"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  orderReservationsQueryKey,
  ordersListRootKey,
} from "@/features/orders/order-query-keys";
import { reserveOrder } from "@/services/orders.service";

/** Reserve stock for a confirmed order (required before fulfill). */
export function useReserveOrder(storeId: string | null, orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return reserveOrder(orderId, { storeId });
    },
    onSuccess: (reservations) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(
        orderReservationsQueryKey(storeId, orderId),
        reservations,
      );
      void queryClient.invalidateQueries({
        queryKey: ordersListRootKey(storeId),
      });
    },
  });
}
