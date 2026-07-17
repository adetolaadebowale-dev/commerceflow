import type { WebhookErrorCode } from "./webhook-error-codes";

export class WebhookError extends Error {
  constructor(
    readonly code: WebhookErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "WebhookError";
  }
}
