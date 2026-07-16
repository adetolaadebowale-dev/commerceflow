/** Result returned by a notification provider after a send attempt. */
export interface NotificationResult {
  readonly success: boolean;
  readonly providerReference?: string;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}
