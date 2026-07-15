import { prisma } from "@/lib/prisma";

import { MemoryCycleCountRepository } from "./memory-cycle-count.repository";
import { PrismaCycleCountRepository } from "./prisma-cycle-count.repository";
import type { CycleCountRepository } from "./cycle-count.repository";

const cycleCountRepository: CycleCountRepository = new PrismaCycleCountRepository(
  prisma,
);

export function getCycleCountRepository(): CycleCountRepository {
  return cycleCountRepository;
}

export type {
  ApproveCycleCountRecord,
  CreateCycleCountRecord,
  CycleCountRepository,
} from "./cycle-count.repository";
export { MemoryCycleCountRepository, PrismaCycleCountRepository };
