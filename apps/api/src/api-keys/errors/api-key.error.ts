import type { ApiKeyErrorCode } from "./api-key-error-codes";

export class ApiKeyError extends Error {
  constructor(
    readonly code: ApiKeyErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiKeyError";
  }
}
