import type { CreateRefundInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import {
  createMemoryPaymentModule,
  createPendingPayment,
  TEST_STORE_A_ID,
} from "@/payments/testing/payment-test-utils";
import { MemoryRefundRepository } from "../repositories/memory-refund.repository";
import { RefundService } from "../services/refund.service";

export { TEST_STORE_A_ID } from "@/payments/testing/payment-test-utils";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryRefundModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const paymentModule = createMemoryPaymentModule(dependencies);
  const refundRepository = new MemoryRefundRepository();

  return {
    ...paymentModule,
    refundRepository,
    refundService: new RefundService({
      refundRepository,
      paymentRepository: paymentModule.paymentRepository,
      ...dependencies,
    }),
  };
}

export function validRefundInput(
  overrides: Partial<CreateRefundInput> = {},
): CreateRefundInput {
  return {
    reason: "Customer requested full refund",
    ...overrides,
  };
}

export async function createPaidPayment(
  module: ReturnType<typeof createMemoryRefundModule>,
) {
  const { order, payment } = await createPendingPayment(module);

  const authorized = await module.paymentService.authorizePayment(
    { storeId: TEST_STORE_A_ID },
    payment.id,
  );

  const paid = await module.paymentService.markPaymentPaid(
    { storeId: TEST_STORE_A_ID },
    authorized.id,
  );

  return { order, payment: paid };
}

export async function createPendingRefund(
  module: ReturnType<typeof createMemoryRefundModule>,
) {
  const { order, payment } = await createPaidPayment(module);
  const refund = await module.refundService.createRefund(
    TEST_STORE_A_ID,
    payment.id,
    validRefundInput(),
  );

  return { order, payment, refund };
}
