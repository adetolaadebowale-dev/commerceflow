import { prisma } from "@/lib/prisma";

import { MemoryWarehouseRepository } from "./memory-warehouse.repository";
import { PrismaWarehouseRepository } from "./prisma-warehouse.repository";
import type { WarehouseRepository } from "./warehouse.repository";

let warehouseRepository: WarehouseRepository | undefined;

export function getWarehouseRepository(): WarehouseRepository {
  if (!warehouseRepository) {
    warehouseRepository = new PrismaWarehouseRepository(prisma);
  }

  return warehouseRepository;
}

export {
  MemoryWarehouseRepository,
  PrismaWarehouseRepository,
  type WarehouseRepository,
};
