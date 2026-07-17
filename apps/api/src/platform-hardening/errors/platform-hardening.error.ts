import type { PlatformHardeningErrorCode } from "./platform-hardening-error-codes";

export class PlatformHardeningError extends Error {
  constructor(
    readonly code: PlatformHardeningErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "PlatformHardeningError";
  }
}
