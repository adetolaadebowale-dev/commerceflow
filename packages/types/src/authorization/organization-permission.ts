/** Organization-scoped permission codes enforced at the API boundary. */
export const ORGANIZATION_PERMISSIONS = [
  "organizations:read",
  "organizations:write",
] as const;

export type OrganizationPermissionCode =
  (typeof ORGANIZATION_PERMISSIONS)[number];
