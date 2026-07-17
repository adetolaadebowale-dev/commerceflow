import type { DisasterReadinessErrorCode } from "./disaster-readiness-error-codes";

export class DisasterReadinessError extends Error {
  constructor(
    readonly code: DisasterReadinessErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DisasterReadinessError";
  }
}
