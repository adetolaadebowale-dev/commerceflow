import { PrismaPromotionRepository } from "./prisma-promotion.repository";
import type { PromotionRepository } from "./promotion.repository";
import { prisma } from "@/lib/prisma";

const promotionRepository: PromotionRepository = new PrismaPromotionRepository(
  prisma,
);

export function getPromotionRepository(): PromotionRepository {
  return promotionRepository;
}

export type { PromotionRepository } from "./promotion.repository";
