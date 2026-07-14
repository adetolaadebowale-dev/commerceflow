import type { CustomerErrorCode } from "./customer-error-codes";

export class CustomerError extends Error {
  readonly code: CustomerErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: CustomerErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "CustomerError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
