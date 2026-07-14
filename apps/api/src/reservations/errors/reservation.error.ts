import type { ReservationErrorCode } from "./reservation-error-codes";

export class ReservationError extends Error {
  constructor(
    public readonly code: ReservationErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}
