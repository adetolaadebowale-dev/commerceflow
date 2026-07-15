import type { WarehouseErrorCode } from "./warehouse-error-codes";

export class WarehouseError extends Error {
  constructor(
    readonly code: WarehouseErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "WarehouseError";
  }
}
