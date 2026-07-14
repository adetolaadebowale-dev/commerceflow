import { PrismaCartRepository } from "./prisma-cart.repository";
import type { CartRepository } from "./cart.repository";
import { prisma } from "@/lib/prisma";

const cartRepository: CartRepository = new PrismaCartRepository(prisma);

export function getCartRepository(): CartRepository {
  return cartRepository;
}

export type { CartRepository } from "./cart.repository";
export type {
  CartItemMutationResult,
  CreateCartRecord,
  PreparedCartItem,
} from "./cart.repository";
