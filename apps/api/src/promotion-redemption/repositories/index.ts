import { PrismaCartPromotionRepository } from "./prisma-cart-promotion.repository";
import type { CartPromotionRepository } from "./cart-promotion.repository";
import { prisma } from "@/lib/prisma";

const cartPromotionRepository: CartPromotionRepository =
  new PrismaCartPromotionRepository(prisma);

export function getCartPromotionRepository(): CartPromotionRepository {
  return cartPromotionRepository;
}

export type { CartPromotionRepository, UpsertCartPromotionRecord } from "./cart-promotion.repository";
