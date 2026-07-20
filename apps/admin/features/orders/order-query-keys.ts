export function ordersQueryKey(
  storeId: string,
  filters?: {
    readonly status?: string;
    readonly page?: number;
    readonly pageSize?: number;
  },
) {
  return [
    "orders",
    storeId,
    filters?.status ?? "all",
    filters?.page ?? 1,
    filters?.pageSize ?? 20,
  ] as const;
}

export function ordersListRootKey(storeId: string) {
  return ["orders", storeId] as const;
}

export function orderDetailQueryKey(storeId: string, orderId: string) {
  return ["order", storeId, orderId] as const;
}

export function orderReservationsQueryKey(storeId: string, orderId: string) {
  return ["order-reservations", storeId, orderId] as const;
}

export function orderCustomerQueryKey(storeId: string, customerId: string) {
  return ["order-customer", storeId, customerId] as const;
}
