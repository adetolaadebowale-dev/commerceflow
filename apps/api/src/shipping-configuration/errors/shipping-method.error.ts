import type { ShippingMethodErrorCode } from "./shipping-method-error-codes";

export class ShippingMethodError extends Error {
  readonly code: ShippingMethodErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ShippingMethodErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ShippingMethodError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
