import type { CycleCountErrorCode } from "./cycle-count-error-codes";

export class CycleCountError extends Error {
  constructor(
    readonly code: CycleCountErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "CycleCountError";
  }
}
