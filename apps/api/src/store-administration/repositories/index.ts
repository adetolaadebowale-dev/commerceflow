import { prisma } from "@/lib/prisma";

import type { StoreAdministrationRepository } from "./store-administration.repository";
import { PrismaStoreAdministrationRepository } from "./prisma-store-administration.repository";

let storeAdministrationRepository: StoreAdministrationRepository | undefined;

export function getStoreAdministrationRepository(): StoreAdministrationRepository {
  if (!storeAdministrationRepository) {
    storeAdministrationRepository = new PrismaStoreAdministrationRepository(
      prisma,
    );
  }

  return storeAdministrationRepository;
}

export { MemoryStoreAdministrationRepository } from "./memory-store-administration.repository";
export type { StoreAdministrationRepository } from "./store-administration.repository";
export { PrismaStoreAdministrationRepository } from "./prisma-store-administration.repository";
