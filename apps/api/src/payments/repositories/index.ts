import { PrismaPaymentRepository } from "./prisma-payment.repository";
import type { PaymentRepository } from "./payment.repository";
import { prisma } from "@/lib/prisma";

const paymentRepository: PaymentRepository = new PrismaPaymentRepository(prisma);

export function getPaymentRepository(): PaymentRepository {
  return paymentRepository;
}

export type { PaymentRepository } from "./payment.repository";
export type {
  CreatePaymentRecord,
  PaymentStatusTransitionInput,
} from "./payment-create-record";
