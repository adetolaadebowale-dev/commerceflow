import { prisma } from "@/lib/prisma";

import { MemoryPurchaseOrderRepository } from "./memory-purchase-order.repository";
import { MemorySupplierRepository } from "./memory-supplier.repository";
import { PrismaPurchaseOrderRepository } from "./prisma-purchase-order.repository";
import { PrismaSupplierRepository } from "./prisma-supplier.repository";
import type { PurchaseOrderRepository } from "./purchase-order.repository";
import type { SupplierRepository } from "./supplier.repository";

const purchaseOrderRepository: PurchaseOrderRepository =
  new PrismaPurchaseOrderRepository(prisma);
const supplierRepository: SupplierRepository = new PrismaSupplierRepository(prisma);

export function getPurchaseOrderRepository(): PurchaseOrderRepository {
  return purchaseOrderRepository;
}

export function getSupplierRepository(): SupplierRepository {
  return supplierRepository;
}

export type {
  CreatePurchaseOrderRecord,
  PurchaseOrderRepository,
} from "./purchase-order.repository";
export type { SupplierRecord, SupplierRepository } from "./supplier.repository";
export {
  MemoryPurchaseOrderRepository,
  MemorySupplierRepository,
  PrismaPurchaseOrderRepository,
  PrismaSupplierRepository,
};
