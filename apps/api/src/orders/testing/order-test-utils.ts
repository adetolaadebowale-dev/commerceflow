import type { CreateOrderInput } from "@commerceflow/validation";

import { MemoryOrderRepository } from "../repositories/memory-order.repository";
import { MemoryOrderVariantSnapshotReader } from "../repositories/memory-order-variant-snapshot.reader";
import { OrderService } from "../services/order.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_VARIANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_CUSTOMER_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

export function createMemoryOrderService(): {
  orderService: OrderService;
  orderRepository: MemoryOrderRepository;
  variantSnapshotReader: MemoryOrderVariantSnapshotReader;
} {
  const orderRepository = new MemoryOrderRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();

  return {
    orderRepository,
    variantSnapshotReader,
    orderService: new OrderService({
      orderRepository,
      orderVariantSnapshotReader: variantSnapshotReader,
    }),
  };
}

export function seedVariant(
  variantSnapshotReader: MemoryOrderVariantSnapshotReader,
  input: {
    storeId: string;
    productVariantId: string;
    productName: string;
    sku: string;
    unitPrice: string;
    currency?: string;
    isActive?: boolean;
  },
): void {
  variantSnapshotReader.seedVariant({
    storeId: input.storeId,
    productVariantId: input.productVariantId,
    productName: input.productName,
    sku: input.sku,
    unitPrice: input.unitPrice,
    currency: input.currency ?? "USD",
    isActive: input.isActive ?? true,
  });
}

export function validOrderInput(
  overrides: Partial<CreateOrderInput> = {},
): CreateOrderInput {
  return {
    storeId: TEST_STORE_A_ID,
    status: "draft",
    items: [{ productVariantId: TEST_VARIANT_A_ID, quantity: 2 }],
    ...overrides,
  };
}

export async function createDraftOrder(
  orderService: OrderService,
  variantSnapshotReader: MemoryOrderVariantSnapshotReader,
  overrides: Partial<CreateOrderInput> = {},
) {
  seedVariant(variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
  });

  return orderService.createOrder(validOrderInput(overrides));
}
