import { prisma } from "@/lib/prisma";
import { getInventoryItemRepository } from "@/inventory/repositories";
import { getPurchaseOrderRepository } from "@/purchase-orders/repositories";

import { MemoryReplenishmentRepository } from "./memory-replenishment.repository";
import { PrismaReplenishmentRepository } from "./prisma-replenishment.repository";
import type { ReplenishmentRepository } from "./replenishment.repository";

let replenishmentRepository: ReplenishmentRepository | undefined;

export function getReplenishmentRepository(): ReplenishmentRepository {
  if (!replenishmentRepository) {
    replenishmentRepository = new PrismaReplenishmentRepository(
      prisma,
      getInventoryItemRepository(),
      getPurchaseOrderRepository(),
    );
  }

  return replenishmentRepository;
}

export {
  MemoryReplenishmentRepository,
  PrismaReplenishmentRepository,
  type ReplenishmentRepository,
};
