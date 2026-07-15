import type { PromotionRedemptionErrorCode } from "./promotion-redemption-error-codes";

export class PromotionRedemptionError extends Error {
  readonly code: PromotionRedemptionErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: PromotionRedemptionErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "PromotionRedemptionError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
