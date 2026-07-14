import type { FulfillmentErrorCode } from "./fulfillment-error-codes";

export class FulfillmentError extends Error {
  constructor(
    public readonly code: FulfillmentErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "FulfillmentError";
  }
}
