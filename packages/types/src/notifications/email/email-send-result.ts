/** Result returned by an email provider after a send attempt. */
export interface EmailSendResult {
  readonly success: boolean;
  readonly providerReference?: string;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}
