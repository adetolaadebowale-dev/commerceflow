import type { PurchaseOrderErrorCode } from "./purchase-order-error-codes";

export class PurchaseOrderError extends Error {
  constructor(
    readonly code: PurchaseOrderErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "PurchaseOrderError";
  }
}
