const STORE_ID_KEY = "commerceflow.admin.storeId";

export function getConfiguredStoreId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(STORE_ID_KEY);
}

export function setConfiguredStoreId(storeId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORE_ID_KEY, storeId);
}
