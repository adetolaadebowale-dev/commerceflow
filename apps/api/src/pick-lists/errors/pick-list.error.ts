import type { PickListErrorCode } from "./pick-list-error-codes";

export class PickListError extends Error {
  readonly code: PickListErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: PickListErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "PickListError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
