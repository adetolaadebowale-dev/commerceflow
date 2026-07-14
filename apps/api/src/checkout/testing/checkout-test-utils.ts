import type { CheckoutCartInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { validCustomerInput } from "@/customers/testing/customer-test-utils";
import { MemoryOrderVariantSnapshotReader } from "@/orders/repositories/memory-order-variant-snapshot.reader";
import { seedVariant } from "@/orders/testing/order-test-utils";
import { MemoryCartRepository } from "@/shopping-cart/repositories/memory-cart.repository";
import { MemoryCheckoutRepository } from "../repositories/memory-checkout.repository";
import { CheckoutService } from "../services/checkout.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export function createMemoryCheckoutModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const cartRepository = new MemoryCartRepository();
  const checkoutRepository = new MemoryCheckoutRepository(cartRepository);
  const customerRepository = new MemoryCustomerRepository();
  const customerAddressRepository = new MemoryCustomerAddressRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();

  return {
    checkoutRepository,
    cartRepository,
    customerRepository,
    customerAddressRepository,
    variantSnapshotReader,
    checkoutService: new CheckoutService({
      checkoutRepository,
      cartRepository,
      customerRepository,
      customerAddressRepository,
      variantSnapshotReader,
      ...dependencies,
    }),
  };
}

export function validCheckoutInput(
  overrides: Partial<CheckoutCartInput> = {},
): CheckoutCartInput {
  return {
    customerAddressId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    ...overrides,
  };
}

export async function seedCheckoutScenario(
  module: ReturnType<typeof createMemoryCheckoutModule>,
) {
  const customer = await module.customerRepository.create(
    validCustomerInput({
      email: `checkout-${crypto.randomUUID().slice(0, 8)}@example.com`,
    }),
  );
  const address = await module.customerAddressRepository.create({
    label: "Home",
    recipientName: "Jane Doe",
    addressLine1: "123 Main St",
    city: "Springfield",
    stateProvince: "IL",
    postalCode: "62704",
    countryCode: "US",
    isDefault: true,
    storeId: TEST_STORE_A_ID,
    customerId: customer.id,
  });
  const cart = await module.cartRepository.create({
    storeId: TEST_STORE_A_ID,
    customerId: customer.id,
  });
  module.checkoutRepository.seedCart(cart);

  seedVariant(module.variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
  });

  const withItem = await module.cartRepository.addOrMergeItem(
    TEST_STORE_A_ID,
    cart.id,
    {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
      unitPriceSnapshot: "19.99",
      currencySnapshot: "USD",
      lineSubtotal: "39.98",
    },
  );

  module.checkoutRepository.seedCart(withItem.cart);

  return {
    customer,
    address,
    cart: withItem.cart,
  };
}
