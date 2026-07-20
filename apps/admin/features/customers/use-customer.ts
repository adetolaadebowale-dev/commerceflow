"use client";

import { useQuery } from "@tanstack/react-query";

import {
  customerDetailQueryKey,
  customerOrdersQueryKey,
} from "@/features/customers/customer-query-keys";
import {
  getCustomer,
  listRecentOrdersForCustomerProfile,
} from "@/services/customers.service";

export function useCustomer(storeId: string | null, customerId: string) {
  const customerQuery = useQuery({
    queryKey: customerDetailQueryKey(storeId ?? "", customerId),
    enabled: Boolean(storeId && customerId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getCustomer(customerId, { storeId });
    },
  });

  const ordersQuery = useQuery({
    queryKey: customerOrdersQueryKey(storeId ?? "", customerId),
    enabled: Boolean(storeId && customerId && customerQuery.isSuccess),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listRecentOrdersForCustomerProfile({
        storeId,
        customerProfileId: customerId,
        limit: 10,
      });
    },
  });

  return {
    customer: customerQuery.data ?? null,
    recentOrders: ordersQuery.data ?? [],
    isLoading: customerQuery.isLoading,
    isError: customerQuery.isError,
    error: customerQuery.error,
    isOrdersError: ordersQuery.isError,
    refetch: async () => {
      await Promise.all([customerQuery.refetch(), ordersQuery.refetch()]);
    },
  };
}
