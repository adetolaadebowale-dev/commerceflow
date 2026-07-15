import type { CreateShippingZoneInput, CreateShippingMethodInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryShippingZoneRepository } from "../repositories/memory-shipping-zone.repository";
import { MemoryShippingMethodRepository } from "../repositories/memory-shipping-method.repository";
import { ShippingZoneService } from "../services/shipping-zone.service";
import { ShippingMethodService } from "../services/shipping-method.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryShippingConfigurationModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}): {
  shippingZoneService: ShippingZoneService;
  shippingMethodService: ShippingMethodService;
  shippingZoneRepository: MemoryShippingZoneRepository;
  shippingMethodRepository: MemoryShippingMethodRepository;
} {
  const shippingZoneRepository = new MemoryShippingZoneRepository();
  const shippingMethodRepository = new MemoryShippingMethodRepository();

  const sharedDependencies = {
    shippingZoneRepository,
    shippingMethodRepository,
    domainEventPublisher: options.domainEventPublisher,
  };

  return {
    shippingZoneRepository,
    shippingMethodRepository,
    shippingZoneService: new ShippingZoneService(sharedDependencies),
    shippingMethodService: new ShippingMethodService(sharedDependencies),
  };
}

export function validShippingZoneInput(
  overrides: Partial<CreateShippingZoneInput> = {},
): CreateShippingZoneInput {
  return {
    storeId: TEST_STORE_A_ID,
    name: "North America",
    countries: ["US", "CA"],
    status: "inactive",
    ...overrides,
  };
}

export function validShippingMethodInput(
  shippingZoneId: string,
  overrides: Partial<CreateShippingMethodInput> = {},
): CreateShippingMethodInput {
  return {
    storeId: TEST_STORE_A_ID,
    shippingZoneId,
    name: "Standard Shipping",
    description: "Flat rate delivery",
    carrier: "internal",
    flatRate: "9.99",
    currency: "USD",
    status: "inactive",
    ...overrides,
  };
}
