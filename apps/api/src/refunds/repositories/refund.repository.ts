import type { Refund } from "@commerceflow/types";

import type { CreateRefundRecord } from "./refund-create-record";
import type { RefundStatusTransitionInput } from "./refund-create-record";

export interface RefundRepository {
  findById(storeId: string, id: string): Promise<Refund | null>;
  findByPaymentId(storeId: string, paymentId: string): Promise<Refund | null>;
  listByPaymentId(storeId: string, paymentId: string): Promise<readonly Refund[]>;
  create(record: CreateRefundRecord): Promise<Refund>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: RefundStatusTransitionInput,
  ): Promise<Refund>;
}
