import type { ShipmentPackageErrorCode } from "./shipment-package-error-codes";

export class ShipmentPackageError extends Error {
  readonly code: ShipmentPackageErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ShipmentPackageErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShipmentPackageError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
