import type { AuditErrorCode } from "./audit-error-codes";

export class AuditError extends Error {
  readonly code: AuditErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AuditErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "AuditError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
