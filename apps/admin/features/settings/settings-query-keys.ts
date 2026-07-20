export function storeSettingsQueryKey(storeId: string) {
  return ["store-settings", storeId] as const;
}

export function organizationQueryKey(organizationId: string) {
  return ["organization", organizationId] as const;
}

export function organizationStoresQueryKey(organizationId: string) {
  return ["organization-stores", organizationId] as const;
}

export function notificationPreferencesQueryKey(storeId: string) {
  return ["notification-preferences", storeId] as const;
}
