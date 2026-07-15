import type { InvoiceErrorCode } from "./invoice-error-codes";

export class InvoiceError extends Error {
  readonly code: InvoiceErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: InvoiceErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "InvoiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
