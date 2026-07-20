export function customersQueryKey(
  storeId: string,
  filters?: {
    readonly search?: string;
    readonly status?: string;
    readonly page?: number;
    readonly pageSize?: number;
  },
) {
  return [
    "customers",
    storeId,
    filters?.search ?? "",
    filters?.status ?? "all",
    filters?.page ?? 1,
    filters?.pageSize ?? 20,
  ] as const;
}

export function customersListRootKey(storeId: string) {
  return ["customers", storeId] as const;
}

export function customerDetailQueryKey(storeId: string, customerId: string) {
  return ["customer", storeId, customerId] as const;
}

export function customerOrdersQueryKey(storeId: string, customerId: string) {
  return ["customer-orders", storeId, customerId] as const;
}
