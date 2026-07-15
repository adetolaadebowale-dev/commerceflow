import type { CreatePaymentInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryOrderVariantSnapshotReader } from "@/orders/repositories/memory-order-variant-snapshot.reader";
import { OrderService } from "@/orders/services/order.service";
import {
  createDraftOrder,
  seedVariant,
  TEST_STORE_A_ID,
  TEST_VARIANT_A_ID,
} from "@/orders/testing/order-test-utils";
import type { PaymentGatewayFactory } from "../gateways";
import { getPaymentGatewayFactory } from "../gateways";
import { MemoryPaymentRepository } from "../repositories/memory-payment.repository";
import { PaymentService } from "../services/payment.service";

export { TEST_STORE_A_ID } from "@/orders/testing/order-test-utils";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryPaymentModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
  paymentGatewayFactory?: PaymentGatewayFactory;
} = {}) {
  const paymentRepository = new MemoryPaymentRepository();
  const orderRepository = new MemoryOrderRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();
  const orderService = new OrderService({
    orderRepository,
    orderVariantSnapshotReader: variantSnapshotReader,
  });

  return {
    paymentRepository,
    orderRepository,
    variantSnapshotReader,
    orderService,
    paymentService: new PaymentService({
      paymentRepository,
      orderRepository,
      paymentGatewayFactory: getPaymentGatewayFactory(),
      ...dependencies,
    }),
  };
}

export function validPaymentInput(
  overrides: Partial<CreatePaymentInput> = {},
): CreatePaymentInput {
  return {
    provider: "internal",
    ...overrides,
  };
}

export async function seedPaymentScenario(
  module: ReturnType<typeof createMemoryPaymentModule>,
) {
  seedVariant(module.variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
  });

  const order = await createDraftOrder(
    module.orderService,
    module.variantSnapshotReader,
  );

  return { order };
}

export async function createPendingPayment(
  module: ReturnType<typeof createMemoryPaymentModule>,
) {
  const { order } = await seedPaymentScenario(module);
  const payment = await module.paymentService.createPayment(
    TEST_STORE_A_ID,
    order.id,
    validPaymentInput(),
  );

  return { order, payment };
}
