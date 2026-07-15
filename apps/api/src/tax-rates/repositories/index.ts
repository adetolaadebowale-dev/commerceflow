import { prisma } from "@/lib/prisma";

import { MemoryTaxRateRepository } from "./memory-tax-rate.repository";
import { PrismaTaxRateRepository } from "./prisma-tax-rate.repository";
import type { TaxRateRepository } from "./tax-rate.repository";

let taxRateRepository: TaxRateRepository | undefined;

export function getTaxRateRepository(): TaxRateRepository {
  if (!taxRateRepository) {
    taxRateRepository = new PrismaTaxRateRepository(prisma);
  }

  return taxRateRepository;
}

export {
  MemoryTaxRateRepository,
  PrismaTaxRateRepository,
  type TaxRateRepository,
};
