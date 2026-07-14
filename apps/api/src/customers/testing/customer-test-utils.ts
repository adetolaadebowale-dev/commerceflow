import type { CreateCustomerInput } from "@commerceflow/validation";
import type { CreateCustomerAddressInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCustomerAddressRepository } from "../repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "../repositories/memory-customer.repository";
import { CustomerAddressService } from "../services/customer-address.service";
import { CustomerService } from "../services/customer.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryCustomerService(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
  customerRepository?: MemoryCustomerRepository;
} = {}) {
  const customerRepository =
    dependencies.customerRepository ?? new MemoryCustomerRepository();

  return {
    customerRepository,
    customerService: new CustomerService({
      customerRepository,
      ...dependencies,
    }),
  };
}

export function createMemoryCustomerAddressService(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
  customerRepository?: MemoryCustomerRepository;
  customerAddressRepository?: MemoryCustomerAddressRepository;
} = {}) {
  const customerRepository =
    dependencies.customerRepository ?? new MemoryCustomerRepository();
  const customerAddressRepository =
    dependencies.customerAddressRepository ??
    new MemoryCustomerAddressRepository();

  return {
    customerRepository,
    customerAddressRepository,
    customerAddressService: new CustomerAddressService({
      customerRepository,
      customerAddressRepository,
      ...dependencies,
    }),
  };
}

export function createMemoryCustomerModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const customerRepository = new MemoryCustomerRepository();
  const customerAddressRepository = new MemoryCustomerAddressRepository();

  return {
    customerRepository,
    customerAddressRepository,
    customerService: new CustomerService({
      customerRepository,
      ...dependencies,
    }),
    customerAddressService: new CustomerAddressService({
      customerRepository,
      customerAddressRepository,
      ...dependencies,
    }),
  };
}

export function validCustomerInput(
  overrides: Partial<CreateCustomerInput> = {},
): CreateCustomerInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    email: `customer-${suffix}@example.com`,
    firstName: "Jane",
    lastName: "Doe",
    status: "active",
    ...overrides,
  };
}

export function validCustomerAddressInput(
  overrides: Partial<CreateCustomerAddressInput> = {},
): CreateCustomerAddressInput {
  return {
    label: "Home",
    recipientName: "Jane Doe",
    addressLine1: "123 Main St",
    city: "Springfield",
    stateProvince: "IL",
    postalCode: "62704",
    countryCode: "US",
    isDefault: false,
    ...overrides,
  };
}
