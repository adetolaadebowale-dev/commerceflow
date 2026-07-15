import type { InventoryAdjustmentErrorCode } from "./inventory-adjustment-error-codes";

export class InventoryAdjustmentError extends Error {
  constructor(
    readonly code: InventoryAdjustmentErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "InventoryAdjustmentError";
  }
}
