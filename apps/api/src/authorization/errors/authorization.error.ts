import type { AuthorizationErrorCode } from "./authorization-error-codes";

export class AuthorizationError extends Error {
  constructor(
    public readonly code: AuthorizationErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}
