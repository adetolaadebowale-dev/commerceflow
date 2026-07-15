import { PrismaRefundRepository } from "./prisma-refund.repository";
import type { RefundRepository } from "./refund.repository";
import { prisma } from "@/lib/prisma";

const refundRepository: RefundRepository = new PrismaRefundRepository(prisma);

export function getRefundRepository(): RefundRepository {
  return refundRepository;
}

export type { RefundRepository } from "./refund.repository";
export type {
  CreateRefundRecord,
  RefundStatusTransitionInput,
} from "./refund-create-record";
