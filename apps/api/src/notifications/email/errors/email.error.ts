import type { EmailErrorCode } from "./email-error-codes";

export class EmailError extends Error {
  constructor(
    readonly code: EmailErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}
