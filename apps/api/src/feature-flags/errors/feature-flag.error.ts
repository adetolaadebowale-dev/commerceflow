import type { FeatureFlagErrorCode } from "./feature-flag-error-codes";

export class FeatureFlagError extends Error {
  constructor(
    readonly code: FeatureFlagErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "FeatureFlagError";
  }
}
