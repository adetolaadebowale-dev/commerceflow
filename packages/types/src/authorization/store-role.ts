/** Store-scoped staff roles for multi-tenant authorization. */
export const STORE_ROLES = ["owner", "admin", "manager", "staff"] as const;

export type StoreRole = (typeof STORE_ROLES)[number];
