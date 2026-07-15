import type { RefundErrorCode } from "./refund-error-codes";

export class RefundError extends Error {
  readonly code: RefundErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: RefundErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "RefundError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
