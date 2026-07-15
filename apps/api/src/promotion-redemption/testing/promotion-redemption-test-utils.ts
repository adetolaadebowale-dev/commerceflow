import type { CreatePromotionInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCheckoutRepository } from "@/checkout/repositories/memory-checkout.repository";
import { CheckoutService } from "@/checkout/services/checkout.service";
import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { validCustomerInput } from "@/customers/testing/customer-test-utils";
import { MemoryOrderVariantSnapshotReader } from "@/orders/repositories/memory-order-variant-snapshot.reader";
import { seedVariant } from "@/orders/testing/order-test-utils";
import { MemoryPromotionRepository } from "@/promotions/repositories/memory-promotion.repository";
import { MemoryCartPromotionRepository } from "../repositories/memory-cart-promotion.repository";
import { PromotionRedemptionService } from "../services/promotion-redemption.service";
import { MemoryTaxRateRepository } from "@/tax-rates/repositories/memory-tax-rate.repository";
import { TaxRateService } from "@/tax-rates/services/tax-rate.service";
import { MemoryCartRepository } from "@/shopping-cart/repositories/memory-cart.repository";
import { CartService } from "@/shopping-cart/services/cart.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export function createMemoryPromotionRedemptionModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const cartRepository = new MemoryCartRepository();
  const cartPromotionRepository = new MemoryCartPromotionRepository();
  const promotionRepository = new MemoryPromotionRepository();
  const taxRateRepository = new MemoryTaxRateRepository();
  const customerRepository = new MemoryCustomerRepository();
  const customerAddressRepository = new MemoryCustomerAddressRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();
  const checkoutRepository = new MemoryCheckoutRepository(cartRepository);

  const promotionRedemptionService = new PromotionRedemptionService({
    cartRepository,
    cartPromotionRepository,
    promotionRepository,
    domainEventPublisher: options.domainEventPublisher,
  });

  const taxRateService = new TaxRateService({
    taxRateRepository,
    domainEventPublisher: options.domainEventPublisher,
  });

  const cartService = new CartService({
    cartRepository,
    customerRepository,
    variantSnapshotReader,
    promotionRedemptionService,
    domainEventPublisher: options.domainEventPublisher,
  });

  const checkoutService = new CheckoutService({
    checkoutRepository,
    cartRepository,
    customerRepository,
    customerAddressRepository,
    variantSnapshotReader,
    promotionRedemptionService,
    taxRateService,
    domainEventPublisher: options.domainEventPublisher,
  });

  return {
    cartRepository,
    cartPromotionRepository,
    promotionRepository,
    taxRateRepository,
    customerRepository,
    customerAddressRepository,
    variantSnapshotReader,
    checkoutRepository,
    promotionRedemptionService,
    taxRateService,
    cartService,
    checkoutService,
  };
}

export function validActivePromotionInput(
  overrides: Partial<CreatePromotionInput> = {},
): CreatePromotionInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    name: "Summer Sale",
    code: `SAVE-${suffix}`,
    type: "percentage",
    value: "20",
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-12-31T23:59:59.000Z",
    ...overrides,
  };
}

export async function seedCartWithItem(
  module: ReturnType<typeof createMemoryPromotionRedemptionModule>,
) {
  const customer = await module.customerRepository.create(
    validCustomerInput({
      email: `promo-${crypto.randomUUID().slice(0, 8)}@example.com`,
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
    unitPrice: "100.00",
    currency: "USD",
  });

  const withItem = await module.cartRepository.addOrMergeItem(
    TEST_STORE_A_ID,
    cart.id,
    {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 1,
      unitPriceSnapshot: "100.00",
      currencySnapshot: "USD",
      lineSubtotal: "100.00",
    },
  );

  module.checkoutRepository.seedCart(withItem.cart);

  return { customer, address, cart: withItem.cart };
}
