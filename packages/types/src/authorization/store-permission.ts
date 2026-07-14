/** Store-scoped permission codes enforced at the API boundary. */
export const STORE_PERMISSIONS = [
  "catalogue:read",
  "catalogue:write",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:write",
  "orders:lifecycle",
  "orders:fulfill",
  "reservations:manage",
  "audit:read",
  "customers:read",
  "customers:write",
  "carts:read",
  "carts:write",
] as const;

export type StorePermissionCode = (typeof STORE_PERMISSIONS)[number];
