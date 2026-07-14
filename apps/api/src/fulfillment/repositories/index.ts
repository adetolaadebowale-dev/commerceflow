import { PrismaFulfillmentRepository } from "./prisma-fulfillment.repository";
import type { FulfillmentRepository } from "./fulfillment.repository";
import { prisma } from "@/lib/prisma";

const fulfillmentRepository: FulfillmentRepository =
  new PrismaFulfillmentRepository(prisma);

export function getFulfillmentRepository(): FulfillmentRepository {
  return fulfillmentRepository;
}

export type { FulfillmentRepository } from "./fulfillment.repository";
