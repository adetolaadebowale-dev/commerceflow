export function brandsQueryKey(
  storeId: string,
  filters?: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
  },
) {
  return [
    "brands",
    storeId,
    filters?.search ?? "",
    filters?.page ?? 1,
    filters?.pageSize ?? 20,
  ] as const;
}

export function brandsListRootKey(storeId: string) {
  return ["brands", storeId] as const;
}

export function brandDetailQueryKey(storeId: string, brandId: string) {
  return ["brand", storeId, brandId] as const;
}

/** Product filter/select lookups that also list brands. */
export function brandsProductFiltersQueryKey(storeId: string) {
  return ["brands", "product-filters", storeId] as const;
}
