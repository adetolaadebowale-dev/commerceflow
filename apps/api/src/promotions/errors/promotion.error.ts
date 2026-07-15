import type { PromotionErrorCode } from "./promotion-error-codes";

export class PromotionError extends Error {
  readonly code: PromotionErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: PromotionErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "PromotionError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
