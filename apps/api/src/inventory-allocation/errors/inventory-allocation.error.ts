import type { InventoryAllocationErrorCode } from "./inventory-allocation-error-codes";

export class InventoryAllocationError extends Error {
  readonly code: InventoryAllocationErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: InventoryAllocationErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "InventoryAllocationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
