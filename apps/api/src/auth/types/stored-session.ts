import type { Session } from "@commerceflow/types";

/**
 * Internal session record with refresh-token rotation metadata.
 */
export interface StoredSession extends Session {
  readonly refreshTokenId: string;
  readonly revoked: boolean;
}

export interface CreateSessionInput {
  readonly userId: string;
  readonly expiresAt: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly refreshTokenId: string;
}
