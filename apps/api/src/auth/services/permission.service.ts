import type { Permission, UserRole } from "@commerceflow/types";

const CUSTOMER_PERMISSIONS: readonly Permission[] = [
  {
    id: "perm-customer-profile-read",
    code: "profile:read",
    name: "Read Profile",
    resource: "profile",
    action: "read",
  },
  {
    id: "perm-customer-orders-read",
    code: "orders:read",
    name: "Read Orders",
    resource: "orders",
    action: "read",
  },
];

const STAFF_PERMISSIONS: readonly Permission[] = [
  ...CUSTOMER_PERMISSIONS,
  {
    id: "perm-staff-catalogue-read",
    code: "catalogue:read",
    name: "Read Catalogue",
    resource: "catalogue",
    action: "read",
  },
  {
    id: "perm-staff-orders-manage",
    code: "orders:manage",
    name: "Manage Orders",
    resource: "orders",
    action: "manage",
  },
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...STAFF_PERMISSIONS,
  {
    id: "perm-admin-users-manage",
    code: "users:manage",
    name: "Manage Users",
    resource: "users",
    action: "manage",
  },
  {
    id: "perm-admin-analytics-read",
    code: "analytics:read",
    name: "Read Analytics",
    resource: "analytics",
    action: "read",
  },
];

const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...ADMIN_PERMISSIONS,
  {
    id: "perm-super-admin-platform-manage",
    code: "platform:manage",
    name: "Manage Platform",
    resource: "platform",
    action: "manage",
  },
];

const PERMISSIONS_BY_ROLE: Record<UserRole, readonly Permission[]> = {
  customer: CUSTOMER_PERMISSIONS,
  staff: STAFF_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
};

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return PERMISSIONS_BY_ROLE[role];
}
