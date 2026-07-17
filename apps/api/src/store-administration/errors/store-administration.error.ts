import type { StoreAdministrationErrorCode } from "./store-administration-error-codes";

export class StoreAdministrationError extends Error {
  constructor(
    readonly code: StoreAdministrationErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "StoreAdministrationError";
  }
}
