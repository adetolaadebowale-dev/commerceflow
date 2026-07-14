import { PrismaInventoryItemRepository } from "./prisma-inventory-item.repository";
import { PrismaStockMovementRepository } from "./prisma-stock-movement.repository";
import type { InventoryItemRepository } from "./inventory-item.repository";
import type { StockMovementRepository } from "./stock-movement.repository";
import { prisma } from "@/lib/prisma";

const inventoryItemRepository: InventoryItemRepository =
  new PrismaInventoryItemRepository(prisma);
const stockMovementRepository: StockMovementRepository =
  new PrismaStockMovementRepository(prisma);

export function getInventoryItemRepository(): InventoryItemRepository {
  return inventoryItemRepository;
}

export function getStockMovementRepository(): StockMovementRepository {
  return stockMovementRepository;
}

export type { InventoryItemRepository } from "./inventory-item.repository";
export type { StockMovementRepository } from "./stock-movement.repository";
export type { InventoryAdjustmentResult } from "./inventory-adjustment-result";
