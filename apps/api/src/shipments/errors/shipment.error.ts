import type { ShipmentErrorCode } from "./shipment-error-codes";

export class ShipmentError extends Error {
  readonly code: ShipmentErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ShipmentErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShipmentError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
