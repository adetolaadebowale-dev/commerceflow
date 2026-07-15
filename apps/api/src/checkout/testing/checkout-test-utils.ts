import type { CheckoutCartInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { validCustomerInput } from "@/customers/testing/customer-test-utils";
import { MemoryOrderVariantSnapshotReader } from "@/orders/repositories/memory-order-variant-snapshot.reader";
import { seedVariant } from "@/orders/testing/order-test-utils";
import { MemoryCartPromotionRepository } from "@/promotion-redemption/repositories/memory-cart-promotion.repository";
import { PromotionRedemptionService } from "@/promotion-redemption/services/promotion-redemption.service";
import { MemoryTaxRateRepository } from "@/tax-rates/repositories/memory-tax-rate.repository";
import { TaxRateService } from "@/tax-rates/services/tax-rate.service";
import { MemoryShippingZoneRepository } from "@/shipping-configuration/repositories/memory-shipping-zone.repository";
import { MemoryShippingMethodRepository } from "@/shipping-configuration/repositories/memory-shipping-method.repository";
import { ShippingZoneService } from "@/shipping-configuration/services/shipping-zone.service";
import { ShippingMethodService } from "@/shipping-configuration/services/shipping-method.service";
import { CheckoutShippingResolver } from "../services/checkout-shipping.resolver";
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
  const cartPromotionRepository = new MemoryCartPromotionRepository();
  const taxRateRepository = new MemoryTaxRateRepository();
  const shippingZoneRepository = new MemoryShippingZoneRepository();
  const shippingMethodRepository = new MemoryShippingMethodRepository();
  const promotionRedemptionService = new PromotionRedemptionService({
    cartRepository,
    cartPromotionRepository,
    domainEventPublisher: dependencies.domainEventPublisher,
  });
  const taxRateService = new TaxRateService({
    taxRateRepository,
    domainEventPublisher: dependencies.domainEventPublisher,
  });
  const shippingZoneService = new ShippingZoneService({
    shippingZoneRepository,
    shippingMethodRepository,
    domainEventPublisher: dependencies.domainEventPublisher,
  });
  const shippingMethodService = new ShippingMethodService({
    shippingMethodRepository,
    shippingZoneRepository,
    domainEventPublisher: dependencies.domainEventPublisher,
  });
  const checkoutShippingResolver = new CheckoutShippingResolver({
    shippingMethodRepository,
    shippingZoneRepository,
  });

  return {
    checkoutRepository,
    cartRepository,
    customerRepository,
    customerAddressRepository,
    variantSnapshotReader,
    cartPromotionRepository,
    taxRateRepository,
    shippingZoneRepository,
    shippingMethodRepository,
    shippingZoneService,
    shippingMethodService,
    checkoutShippingResolver,
    promotionRedemptionService,
    taxRateService,
    checkoutService: new CheckoutService({
      checkoutRepository,
      cartRepository,
      customerRepository,
      customerAddressRepository,
      variantSnapshotReader,
      promotionRedemptionService,
      taxRateService,
      checkoutShippingResolver,
      ...dependencies,
    }),
  };
}

export function validCheckoutInput(
  overrides: Partial<CheckoutCartInput> = {},
): CheckoutCartInput {
  return {
    customerAddressId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    shippingMethodId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    ...overrides,
  };
}

export async function seedEligibleShipping(
  module: ReturnType<typeof createMemoryCheckoutModule>,
  overrides: {
    countries?: readonly string[];
    flatRate?: string;
    currency?: string;
  } = {},
) {
  const zone = await module.shippingZoneService.createShippingZone({
    storeId: TEST_STORE_A_ID,
    name: "Domestic",
    countries: [...(overrides.countries ?? ["US"])],
    status: "active",
  });

  const method = await module.shippingMethodService.createShippingMethod({
    storeId: TEST_STORE_A_ID,
    shippingZoneId: zone.id,
    name: "Standard Shipping",
    carrier: "internal",
    flatRate: overrides.flatRate ?? "9.99",
    currency: overrides.currency ?? "USD",
    status: "active",
  });

  return { zone, method };
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
  const { method: shippingMethod } = await seedEligibleShipping(module, {
    flatRate: "5.00",
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
    shippingMethod,
    cart: withItem.cart,
  };
}
