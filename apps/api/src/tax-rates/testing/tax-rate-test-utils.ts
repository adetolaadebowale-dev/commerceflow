import type { CreateTaxRateInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryTaxRateRepository } from "../repositories/memory-tax-rate.repository";
import { TaxRateService } from "../services/tax-rate.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryTaxRateModule(options: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const taxRateRepository = new MemoryTaxRateRepository();

  return {
    taxRateRepository,
    taxRateService: new TaxRateService({
      taxRateRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validTaxRateInput(
  overrides: Partial<CreateTaxRateInput> = {},
): CreateTaxRateInput {
  return {
    storeId: TEST_STORE_A_ID,
    name: "Standard Sales Tax",
    percentage: "8.25",
    status: "inactive",
    ...overrides,
  };
}
