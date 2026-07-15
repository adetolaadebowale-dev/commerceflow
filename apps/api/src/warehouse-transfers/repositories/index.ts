import { prisma } from "@/lib/prisma";

import { MemoryWarehouseTransferRepository } from "./memory-warehouse-transfer.repository";
import { PrismaWarehouseTransferRepository } from "./prisma-warehouse-transfer.repository";
import type { WarehouseTransferRepository } from "./warehouse-transfer.repository";

const warehouseTransferRepository: WarehouseTransferRepository =
  new PrismaWarehouseTransferRepository(prisma);

export function getWarehouseTransferRepository(): WarehouseTransferRepository {
  return warehouseTransferRepository;
}

export type {
  CreateWarehouseTransferRecord,
  WarehouseTransferRepository,
} from "./warehouse-transfer.repository";
export { MemoryWarehouseTransferRepository, PrismaWarehouseTransferRepository };
