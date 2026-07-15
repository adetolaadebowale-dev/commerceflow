import { prisma } from "@/lib/prisma";

import { MemorySupplierRepository } from "./memory-supplier.repository";
import { PrismaSupplierRepository } from "./prisma-supplier.repository";
import type { SupplierRepository } from "./supplier.repository";

let supplierRepository: SupplierRepository | undefined;

export function getSupplierRepository(): SupplierRepository {
  if (!supplierRepository) {
    supplierRepository = new PrismaSupplierRepository(prisma);
  }

  return supplierRepository;
}

export {
  MemorySupplierRepository,
  PrismaSupplierRepository,
  type SupplierRepository,
};
