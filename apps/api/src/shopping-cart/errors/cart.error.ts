import type { CartErrorCode } from "./cart-error-codes";

export class CartError extends Error {
  constructor(
    public readonly code: CartErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CartError";
  }
}
