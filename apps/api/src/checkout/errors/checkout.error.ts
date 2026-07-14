import type { CheckoutErrorCode } from "./checkout-error-codes";

export class CheckoutError extends Error {
  constructor(
    public readonly code: CheckoutErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}
