import type { OperationsErrorCode } from "./operations-error-codes";

export class OperationsError extends Error {
  constructor(
    readonly code: OperationsErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "OperationsError";
  }
}
