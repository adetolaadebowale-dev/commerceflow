import type { CreateCartInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { CustomerService } from "@/customers/services/customer.service";
import { validCustomerInput } from "@/customers/testing/customer-test-utils";
import { MemoryOrderVariantSnapshotReader } from "@/orders/repositories/memory-order-variant-snapshot.reader";
import { seedVariant } from "@/orders/testing/order-test-utils";
import { MemoryCartRepository } from "../repositories/memory-cart.repository";
import { CartService } from "../services/cart.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_VARIANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export function createMemoryCartModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const cartRepository = new MemoryCartRepository();
  const customerRepository = new MemoryCustomerRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();

  return {
    cartRepository,
    customerRepository,
    variantSnapshotReader,
    customerService: new CustomerService({ customerRepository }),
    cartService: new CartService({
      cartRepository,
      customerRepository,
      variantSnapshotReader,
      ...dependencies,
    }),
  };
}

export function validCartInput(
  overrides: Partial<CreateCartInput> = {},
): CreateCartInput {
  return {
    storeId: TEST_STORE_A_ID,
    customerId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    ...overrides,
  };
}

export async function seedCustomerAndVariant(
  customerService: CustomerService,
  variantSnapshotReader: MemoryOrderVariantSnapshotReader,
  overrides: {
    customerId?: string;
    variantId?: string;
    unitPrice?: string;
    currency?: string;
  } = {},
) {
  const customer = await customerService.createCustomer(
    validCustomerInput({
      email: `cart-customer-${crypto.randomUUID().slice(0, 8)}@example.com`,
    }),
  );

  seedVariant(variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: overrides.variantId ?? TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: overrides.unitPrice ?? "19.99",
    currency: overrides.currency ?? "USD",
  });

  return {
    customer,
    customerId: overrides.customerId ?? customer.id,
    variantId: overrides.variantId ?? TEST_VARIANT_A_ID,
  };
}
