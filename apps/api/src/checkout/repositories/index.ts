import { PrismaCheckoutRepository } from "./prisma-checkout.repository";
import type { CheckoutRepository } from "./checkout.repository";
import { prisma } from "@/lib/prisma";

const checkoutRepository: CheckoutRepository = new PrismaCheckoutRepository(
  prisma,
);

export function getCheckoutRepository(): CheckoutRepository {
  return checkoutRepository;
}

export type { CheckoutRecord, CheckoutRepository } from "./checkout.repository";
