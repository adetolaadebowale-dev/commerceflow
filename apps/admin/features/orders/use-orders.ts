"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "@commerceflow/types";
import { useMemo, useState } from "react";

import { ordersQueryKey } from "@/features/orders/order-query-keys";
import {
  formatCustomerLabel,
  listCustomers,
  listOrders,
} from "@/services/orders.service";

export interface OrderListFilters {
  readonly status: OrderStatus | "all";
  readonly page: number;
  readonly pageSize: number;
}

export interface OrderListRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly customer: string;
  readonly status: OrderStatus;
  readonly total: string;
  readonly currency: string;
  readonly createdAt: string;
}

const DEFAULT_FILTERS: OrderListFilters = {
  status: "all",
  page: 1,
  pageSize: 20,
};

export function useOrders(storeId: string | null) {
  const [filters, setFilters] = useState<OrderListFilters>(DEFAULT_FILTERS);

  const customersQuery = useQuery({
    queryKey: ["customers", "order-labels", storeId],
    enabled: Boolean(storeId),
    staleTime: 60_000,
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listCustomers({ storeId, page: 1, limit: 100 });
    },
  });

  const ordersQuery = useQuery({
    queryKey: ordersQueryKey(storeId ?? "", {
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listOrders({
        storeId,
        page: filters.page,
        limit: filters.pageSize,
        status: filters.status === "all" ? undefined : filters.status,
      });
    },
  });

  const customersById = useMemo(() => {
    return new Map(
      (customersQuery.data?.items ?? []).map((customer) => [
        customer.id,
        customer,
      ]),
    );
  }, [customersQuery.data?.items]);

  const rows = useMemo<readonly OrderListRow[]>(() => {
    return (ordersQuery.data?.items ?? []).map((order) => {
      const profileId = order.customerProfileId ?? order.customerId;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: formatCustomerLabel(
          profileId ? customersById.get(profileId) : undefined,
          profileId,
        ),
        status: order.status,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      };
    });
  }, [ordersQuery.data?.items, customersById]);

  function updateFilters(
    patch: Partial<OrderListFilters>,
    options?: { resetPage?: boolean },
  ) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page:
        options?.resetPage === false
          ? (patch.page ?? current.page)
          : (patch.page ?? 1),
    }));
  }

  return {
    filters,
    setStatus: (status: OrderListFilters["status"]) =>
      updateFilters({ status }),
    setPage: (page: number) => updateFilters({ page }, { resetPage: false }),
    setPageSize: (pageSize: number) => updateFilters({ pageSize, page: 1 }),
    rows,
    total: ordersQuery.data?.total ?? 0,
    totalPages: ordersQuery.data?.totalPages ?? 0,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
  };
}
