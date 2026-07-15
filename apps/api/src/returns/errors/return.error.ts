import type { ReturnErrorCode } from "./return-error-codes";

export class ReturnError extends Error {
  constructor(
    readonly code: ReturnErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ReturnError";
  }
}
