import { prisma } from "@/lib/prisma";

import type { OrganizationRepository } from "./organization.repository";
import { PrismaOrganizationRepository } from "./prisma-organization.repository";

let organizationRepository: OrganizationRepository | undefined;

export function getOrganizationRepository(): OrganizationRepository {
  if (!organizationRepository) {
    organizationRepository = new PrismaOrganizationRepository(prisma);
  }

  return organizationRepository;
}

export { MemoryOrganizationRepository } from "./memory-organization.repository";
export type { OrganizationRepository } from "./organization.repository";
export { PrismaOrganizationRepository } from "./prisma-organization.repository";
