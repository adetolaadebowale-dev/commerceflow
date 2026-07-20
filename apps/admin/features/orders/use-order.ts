"use client";

import { useQuery } from "@tanstack/react-query";

import {
  orderCustomerQueryKey,
  orderDetailQueryKey,
  orderReservationsQueryKey,
} from "@/features/orders/order-query-keys";
import {
  getCustomer,
  getOrder,
  listOrderReservations,
} from "@/services/orders.service";

export function useOrder(storeId: string | null, orderId: string) {
  const orderQuery = useQuery({
    queryKey: orderDetailQueryKey(storeId ?? "", orderId),
    enabled: Boolean(storeId && orderId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getOrder(orderId, { storeId });
    },
  });

  const customerId =
    orderQuery.data?.customerProfileId ?? orderQuery.data?.customerId;

  const customerQuery = useQuery({
    queryKey: orderCustomerQueryKey(storeId ?? "", customerId ?? ""),
    enabled: Boolean(storeId && customerId),
    queryFn: () => {
      if (!storeId || !customerId) {
        throw new Error("Store id and customer id are required");
      }
      return getCustomer(customerId, { storeId });
    },
  });

  const reservationsQuery = useQuery({
    queryKey: orderReservationsQueryKey(storeId ?? "", orderId),
    enabled: Boolean(storeId && orderId && orderQuery.isSuccess),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listOrderReservations(orderId, { storeId });
    },
  });

  return {
    order: orderQuery.data ?? null,
    customer: customerQuery.data ?? null,
    reservations: reservationsQuery.data ?? [],
    isLoading: orderQuery.isLoading,
    isError: orderQuery.isError,
    error: orderQuery.error,
    isReservationsError: reservationsQuery.isError,
    isCustomerError: customerQuery.isError,
    refetch: async () => {
      await Promise.all([
        orderQuery.refetch(),
        reservationsQuery.refetch(),
        customerQuery.refetch(),
      ]);
    },
  };
}
