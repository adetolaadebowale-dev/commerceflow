import type { LoadTestingErrorCode } from "./load-testing-error-codes";

export class LoadTestingError extends Error {
  constructor(
    readonly code: LoadTestingErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "LoadTestingError";
  }
}
