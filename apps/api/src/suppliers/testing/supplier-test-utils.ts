import type { CreateSupplierInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemorySupplierRepository } from "../repositories/memory-supplier.repository";
import { SupplierService } from "../services/supplier.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemorySupplierModule(
  options: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const supplierRepository = new MemorySupplierRepository();

  return {
    supplierRepository,
    supplierService: new SupplierService({
      supplierRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validSupplierInput(
  overrides: Partial<CreateSupplierInput> = {},
): CreateSupplierInput {
  return {
    storeId: TEST_STORE_A_ID,
    code: "ACME",
    name: "Acme Supplies",
    paymentTerm: "net30",
    currency: "USD",
    status: "active",
    ...overrides,
  };
}

export async function seedActiveSupplier(
  supplierService: SupplierService,
  overrides: Partial<CreateSupplierInput> = {},
) {
  return supplierService.createSupplier(
    validSupplierInput({
      code: "SEED",
      name: "Seed Supplier",
      ...overrides,
    }),
  );
}
