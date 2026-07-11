import type { UserRole } from "@commerceflow/types";

/**
 * Internal user record including credential material.
 * Never exposed outside the repository or auth service layer.
 */
export interface StoredUser {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly passwordHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateUserInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role?: UserRole;
}
