import type { ShipmentTrackingErrorCode } from "./shipment-tracking-error-codes";

export class ShipmentTrackingError extends Error {
  readonly code: ShipmentTrackingErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ShipmentTrackingErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShipmentTrackingError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
