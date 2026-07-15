import type { TaxRateErrorCode } from "./tax-rate-error-codes";

export class TaxRateError extends Error {
  constructor(
    readonly code: TaxRateErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "TaxRateError";
  }
}
