import type { Refund } from "@commerceflow/types";
import type {
  CreateRefundInput,
  ListPaymentRefundsQuery,
  RefundIdQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type RefundStoreScopedParams = RefundIdQuery;
export type ListPaymentRefundsParams = ListPaymentRefundsQuery;
export type CreateRefundRequest = CreateRefundInput;

export type CreateRefundResponse = ApiSuccessResponse<{ refund: Refund }>;
export type GetRefundResponse = ApiSuccessResponse<{ refund: Refund }>;
export type ListPaymentRefundsResponse = ApiSuccessResponse<{
  refunds: readonly Refund[];
}>;
export type RefundActionResponse = ApiSuccessResponse<{ refund: Refund }>;
