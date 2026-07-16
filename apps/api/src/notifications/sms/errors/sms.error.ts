import type { SmsErrorCode } from "./sms-error-codes";

export class SmsError extends Error {
  constructor(
    readonly code: SmsErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "SmsError";
  }
}
