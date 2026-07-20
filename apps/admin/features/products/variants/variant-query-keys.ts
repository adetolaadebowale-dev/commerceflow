export function productVariantsQueryKey(storeId: string, productId: string) {
  return ["product-variants", storeId, productId] as const;
}
