/**
 * Request metadata captured when creating or validating sessions.
 */
export interface RequestContext {
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
