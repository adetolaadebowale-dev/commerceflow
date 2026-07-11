/**
 * Active authenticated session bound to a user account.
 */
export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
