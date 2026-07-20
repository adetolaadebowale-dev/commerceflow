export function categoriesQueryKey(
  storeId: string,
  filters?: {
    readonly search?: string;
    readonly page?: number;
    readonly pageSize?: number;
  },
) {
  return [
    "categories",
    storeId,
    filters?.search ?? "",
    filters?.page ?? 1,
    filters?.pageSize ?? 20,
  ] as const;
}

export function categoriesListRootKey(storeId: string) {
  return ["categories", storeId] as const;
}

export function categoryDetailQueryKey(storeId: string, categoryId: string) {
  return ["category", storeId, categoryId] as const;
}

/** Product filter/select lookups that also list categories. */
export function categoriesProductFiltersQueryKey(storeId: string) {
  return ["categories", "product-filters", storeId] as const;
}
