export function inventoryItemsQueryKey(
  storeId: string,
  productId: string,
) {
  return ["inventory-items", storeId, productId] as const;
}

export function inventorySummaryQueryKey(
  storeId: string,
  productId: string,
) {
  return ["inventory-summary", storeId, productId] as const;
}

export function inventoryHistoryQueryKey(
  storeId: string,
  inventoryItemId: string,
  page: number,
) {
  return ["inventory-history", storeId, inventoryItemId, page] as const;
}
