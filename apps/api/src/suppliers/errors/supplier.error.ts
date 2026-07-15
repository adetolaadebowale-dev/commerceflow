import type { SupplierErrorCode } from "./supplier-error-codes";

export class SupplierError extends Error {
  constructor(
    readonly code: SupplierErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "SupplierError";
  }
}
