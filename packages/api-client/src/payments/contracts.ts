import type { Payment } from "@commerceflow/types";
import type {
  CreatePaymentInput,
  ListOrderPaymentsQuery,
  PaymentIdQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type PaymentStoreScopedParams = PaymentIdQuery;
export type ListOrderPaymentsParams = ListOrderPaymentsQuery;
export type CreatePaymentRequest = CreatePaymentInput;

export type CreatePaymentResponse = ApiSuccessResponse<{ payment: Payment }>;
export type GetPaymentResponse = ApiSuccessResponse<{ payment: Payment }>;
export type ListOrderPaymentsResponse = ApiSuccessResponse<{
  payments: readonly Payment[];
}>;
export type PaymentActionResponse = ApiSuccessResponse<{ payment: Payment }>;
