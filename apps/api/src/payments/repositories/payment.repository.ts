import type { Payment } from "@commerceflow/types";

import type { CreatePaymentRecord } from "./payment-create-record";
import type { PaymentStatusTransitionInput } from "./payment-create-record";

export interface PaymentRepository {
  findById(storeId: string, id: string): Promise<Payment | null>;
  listByOrderId(storeId: string, orderId: string): Promise<readonly Payment[]>;
  create(record: CreatePaymentRecord): Promise<Payment>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: PaymentStatusTransitionInput,
  ): Promise<Payment>;
}
