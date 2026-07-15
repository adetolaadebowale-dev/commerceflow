import type { WarehouseTransferErrorCode } from "./warehouse-transfer-error-codes";

export class WarehouseTransferError extends Error {
  constructor(
    readonly code: WarehouseTransferErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "WarehouseTransferError";
  }
}
