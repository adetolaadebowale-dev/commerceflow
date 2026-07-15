import type { PaymentErrorCode } from "./payment-error-codes";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: PaymentErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
