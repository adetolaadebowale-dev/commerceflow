import { PrismaInventoryAllocationRepository } from "./prisma-inventory-allocation.repository";
import type { InventoryAllocationRepository } from "./inventory-allocation.repository";
import { prisma } from "@/lib/prisma";

const inventoryAllocationRepository: InventoryAllocationRepository =
  new PrismaInventoryAllocationRepository(prisma);

export function getInventoryAllocationRepository(): InventoryAllocationRepository {
  return inventoryAllocationRepository;
}

export type { InventoryAllocationRepository } from "./inventory-allocation.repository";
export type {
  CreateInventoryAllocationRecord,
  ReportInventoryAllocationShortageRecord,
  UpdateInventoryAllocationPickedRecord,
} from "./inventory-allocation-create-record";
