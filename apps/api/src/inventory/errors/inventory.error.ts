import type { InventoryErrorCode } from "./inventory-error-codes";

export class InventoryError extends Error {
  constructor(
    public readonly code: InventoryErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "InventoryError";
  }
}
