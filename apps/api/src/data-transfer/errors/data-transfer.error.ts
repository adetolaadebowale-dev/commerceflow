import type { DataTransferErrorCode } from "./data-transfer-error-codes";

export class DataTransferError extends Error {
  constructor(
    readonly code: DataTransferErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DataTransferError";
  }
}
