import { PrismaStoreMemberRepository } from "./prisma-store-member.repository";
import type { StoreMemberRepository } from "./store-member.repository";
import { prisma } from "@/lib/prisma";

const storeMemberRepository: StoreMemberRepository =
  new PrismaStoreMemberRepository(prisma);

export function getStoreMemberRepository(): StoreMemberRepository {
  return storeMemberRepository;
}

export type { StoreMemberRepository } from "./store-member.repository";
