import type { OrganizationPermissionCode, StoreRole } from "@commerceflow/types";

const PERMISSIONS_BY_ORGANIZATION_ROLE: Readonly<
  Record<StoreRole, readonly OrganizationPermissionCode[]>
> = {
  owner: ["organizations:read", "organizations:write"],
  admin: ["organizations:read", "organizations:write"],
  manager: ["organizations:read"],
  staff: ["organizations:read"],
};

const ROLE_PRIORITY: readonly StoreRole[] = [
  "owner",
  "admin",
  "manager",
  "staff",
];

export const OrganizationPermissionPolicy = {
  permissionsForRole(role: StoreRole): readonly OrganizationPermissionCode[] {
    return PERMISSIONS_BY_ORGANIZATION_ROLE[role];
  },

  hasPermission(
    role: StoreRole,
    permission: OrganizationPermissionCode,
  ): boolean {
    return PERMISSIONS_BY_ORGANIZATION_ROLE[role].includes(permission);
  },

  highestRole(roles: readonly StoreRole[]): StoreRole | null {
    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
        return role;
      }
    }

    return null;
  },
} as const;
