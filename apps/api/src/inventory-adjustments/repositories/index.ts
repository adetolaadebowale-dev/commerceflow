import { prisma } from "@/lib/prisma";

import { MemoryInventoryAdjustmentRepository } from "./memory-inventory-adjustment.repository";
import { PrismaInventoryAdjustmentRepository } from "./prisma-inventory-adjustment.repository";
import type { InventoryAdjustmentRepository } from "./inventory-adjustment.repository";

const inventoryAdjustmentRepository: InventoryAdjustmentRepository =
  new PrismaInventoryAdjustmentRepository(prisma);

export function getInventoryAdjustmentRepository(): InventoryAdjustmentRepository {
  return inventoryAdjustmentRepository;
}

export type {
  CreateInventoryAdjustmentRecord,
  InventoryAdjustmentRepository,
} from "./inventory-adjustment.repository";
export {
  MemoryInventoryAdjustmentRepository,
  PrismaInventoryAdjustmentRepository,
};
