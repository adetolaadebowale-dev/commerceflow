import type { StorePermissionCode, StoreRole } from "@commerceflow/types";

const ALL_STORE_PERMISSIONS: readonly StorePermissionCode[] = [
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
  "payments:read",
  "payments:write",
  "payments:lifecycle",
  "invoices:read",
  "invoices:write",
  "invoices:lifecycle",
  "refunds:read",
  "refunds:write",
  "refunds:lifecycle",
  "promotions:read",
  "promotions:write",
];

const PERMISSIONS_BY_STORE_ROLE: Readonly<
  Record<StoreRole, readonly StorePermissionCode[]>
> = {
  owner: ALL_STORE_PERMISSIONS,
  admin: ALL_STORE_PERMISSIONS,
  manager: [
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
    "payments:read",
    "payments:write",
    "payments:lifecycle",
    "invoices:read",
    "invoices:write",
    "invoices:lifecycle",
    "refunds:read",
    "refunds:write",
    "refunds:lifecycle",
    "promotions:read",
    "promotions:write",
  ],
  staff: [
    "catalogue:read",
    "inventory:read",
    "orders:read",
    "orders:write",
    "customers:read",
    "carts:read",
    "carts:write",
    "payments:read",
    "invoices:read",
    "refunds:read",
    "promotions:read",
  ],
};

export const StorePermissionPolicy = {
  permissionsForRole(role: StoreRole): readonly StorePermissionCode[] {
    return PERMISSIONS_BY_STORE_ROLE[role];
  },

  hasPermission(role: StoreRole, permission: StorePermissionCode): boolean {
    return PERMISSIONS_BY_STORE_ROLE[role].includes(permission);
  },
} as const;
