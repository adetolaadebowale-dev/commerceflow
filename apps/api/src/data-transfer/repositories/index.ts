import { prisma } from "@/lib/prisma";

import type { ExportRepository } from "./export.repository";
import type { ImportRepository } from "./import.repository";
import { PrismaExportRepository } from "./prisma-export.repository";
import { PrismaImportRepository } from "./prisma-import.repository";

let importRepository: ImportRepository | undefined;
let exportRepository: ExportRepository | undefined;

export function getImportRepository(): ImportRepository {
  if (!importRepository) {
    importRepository = new PrismaImportRepository(prisma);
  }

  return importRepository;
}

export function getExportRepository(): ExportRepository {
  if (!exportRepository) {
    exportRepository = new PrismaExportRepository(prisma);
  }

  return exportRepository;
}

export { MemoryExportRepository } from "./memory-export.repository";
export { MemoryImportRepository } from "./memory-import.repository";
export type { ExportRepository } from "./export.repository";
export type { ImportRepository } from "./import.repository";
export { PrismaExportRepository } from "./prisma-export.repository";
export { PrismaImportRepository } from "./prisma-import.repository";
