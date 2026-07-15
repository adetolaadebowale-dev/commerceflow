import { prisma } from "@/lib/prisma";

import { MemoryReturnRepository } from "./memory-return.repository";
import { PrismaReturnRepository } from "./prisma-return.repository";
import type { ReturnRepository } from "./return.repository";

const returnRepository: ReturnRepository = new PrismaReturnRepository(prisma);

export function getReturnRepository(): ReturnRepository {
  return returnRepository;
}

export type { CreateReturnRecord, ReturnRepository } from "./return.repository";
export { MemoryReturnRepository, PrismaReturnRepository };
