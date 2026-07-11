import type { Permission } from "./permission";
import type { Session } from "./session";
import type { User } from "./user";

/**
 * Fully resolved identity context for an authenticated request.
 */
export interface AuthenticatedUser {
  readonly user: User;
  readonly permissions: readonly Permission[];
  readonly session: Session;
}
