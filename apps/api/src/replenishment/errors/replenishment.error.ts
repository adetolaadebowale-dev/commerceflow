import type { ReplenishmentErrorCode } from "./replenishment-error-codes";

export class ReplenishmentError extends Error {
  constructor(
    readonly code: ReplenishmentErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ReplenishmentError";
  }
}
