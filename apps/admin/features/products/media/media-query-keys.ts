export function productDetailQueryKey(storeId: string, productId: string) {
  return ["product", storeId, productId] as const;
}

export function productMediaQueryKey(storeId: string, productId: string) {
  return ["product-media", storeId, productId] as const;
}
