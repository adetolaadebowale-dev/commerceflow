import type { ShippingZoneErrorCode } from "./shipping-zone-error-codes";

export class ShippingZoneError extends Error {
  readonly code: ShippingZoneErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ShippingZoneErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShippingZoneError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
