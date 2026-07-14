import type { CheckoutResult } from "@commerceflow/types";
import type { CheckoutCartInput, CheckoutCartQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /carts/:id/checkout */
export type CheckoutCartRequest = CheckoutCartInput;
export type CheckoutCartResponse = ApiSuccessResponse<CheckoutResult>;

export interface CheckoutCartParams extends CheckoutCartQuery {}
