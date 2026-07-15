import type { CreateInvoiceInput } from "@commerceflow/validation";

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
import { MemoryInvoiceRepository } from "../repositories/memory-invoice.repository";
import { InvoiceService } from "../services/invoice.service";

export { TEST_STORE_A_ID } from "@/orders/testing/order-test-utils";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryInvoiceModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const invoiceRepository = new MemoryInvoiceRepository();
  const orderRepository = new MemoryOrderRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();
  const orderService = new OrderService({
    orderRepository,
    orderVariantSnapshotReader: variantSnapshotReader,
  });

  return {
    invoiceRepository,
    orderRepository,
    variantSnapshotReader,
    orderService,
    invoiceService: new InvoiceService({
      invoiceRepository,
      orderRepository,
      ...dependencies,
    }),
  };
}

export function validInvoiceInput(
  overrides: Partial<CreateInvoiceInput> = {},
): CreateInvoiceInput {
  return {
    ...overrides,
  };
}

export async function seedInvoiceScenario(
  module: ReturnType<typeof createMemoryInvoiceModule>,
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

export async function createDraftInvoice(
  module: ReturnType<typeof createMemoryInvoiceModule>,
) {
  const { order } = await seedInvoiceScenario(module);
  const invoice = await module.invoiceService.createInvoice(
    TEST_STORE_A_ID,
    order.id,
    validInvoiceInput(),
  );

  return { order, invoice };
}
