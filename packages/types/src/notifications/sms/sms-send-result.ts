/** Result returned by an SMS provider after a send attempt. */
export interface SmsSendResult {
  readonly success: boolean;
  readonly providerReference?: string;
  readonly message?: string;
  readonly metadata?: Record<string, unknown>;
}
