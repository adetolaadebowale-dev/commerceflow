import { prisma } from "@/lib/prisma";

import { MemoryPurchaseOrderRepository } from "./memory-purchase-order.repository";
import { PrismaPurchaseOrderRepository } from "./prisma-purchase-order.repository";
import type { PurchaseOrderRepository } from "./purchase-order.repository";

const purchaseOrderRepository: PurchaseOrderRepository =
  new PrismaPurchaseOrderRepository(prisma);

export function getPurchaseOrderRepository(): PurchaseOrderRepository {
  return purchaseOrderRepository;
}

export type {
  CreatePurchaseOrderRecord,
  PurchaseOrderRepository,
} from "./purchase-order.repository";
export {
  MemoryPurchaseOrderRepository,
  PrismaPurchaseOrderRepository,
};
