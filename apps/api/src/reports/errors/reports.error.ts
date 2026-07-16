import type { ReportsErrorCode } from "./reports-error-codes";

export class ReportsError extends Error {
  readonly code: ReportsErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ReportsErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ReportsError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
