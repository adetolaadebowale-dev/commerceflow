import type { PlatformOperationsErrorCode } from "./platform-operations-error-codes";

export class PlatformOperationsError extends Error {
  constructor(
    readonly code: PlatformOperationsErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "PlatformOperationsError";
  }
}
