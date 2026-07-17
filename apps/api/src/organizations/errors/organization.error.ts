import type { OrganizationErrorCode } from "./organization-error-codes";

export class OrganizationError extends Error {
  constructor(
    readonly code: OrganizationErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "OrganizationError";
  }
}
