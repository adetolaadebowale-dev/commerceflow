export function warehousesQueryKey(
  storeId: string,
  filters?: {
    readonly search?: string;
    readonly status?: string;
    readonly page?: number;
    readonly pageSize?: number;
  },
) {
  return [
    "warehouses",
    storeId,
    filters?.search ?? "",
    filters?.status ?? "all",
    filters?.page ?? 1,
    filters?.pageSize ?? 20,
  ] as const;
}

export function warehousesListRootKey(storeId: string) {
  return ["warehouses", storeId] as const;
}
