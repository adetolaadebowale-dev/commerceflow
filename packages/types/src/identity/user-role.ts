/**
 * Platform roles governing access scope across CommerceFlow applications.
 */
export type UserRole = "customer" | "staff" | "admin" | "super_admin";

export const USER_ROLES = [
  "customer",
  "staff",
  "admin",
  "super_admin",
] as const satisfies readonly UserRole[];
