import type { UserRole } from "./user-role";

/**
 * Account holder within the CommerceFlow platform.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}
