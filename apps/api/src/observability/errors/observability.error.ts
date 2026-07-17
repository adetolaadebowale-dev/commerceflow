import type { ObservabilityErrorCode } from "./observability-error-codes";

export class ObservabilityError extends Error {
  constructor(
    readonly code: ObservabilityErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ObservabilityError";
  }
}
