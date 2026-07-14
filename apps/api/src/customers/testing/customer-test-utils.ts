import type { CreateCustomerInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCustomerRepository } from "../repositories/memory-customer.repository";
import { CustomerService } from "../services/customer.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryCustomerService(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const customerRepository = new MemoryCustomerRepository();

  return {
    customerRepository,
    customerService: new CustomerService({
      customerRepository,
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
