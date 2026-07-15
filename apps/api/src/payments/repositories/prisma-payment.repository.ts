import {
  Prisma,
  type Payment as PrismaPayment,
  type PrismaClient,
} from "@prisma/client";
import type { Payment } from "@commerceflow/types";

import type { CreatePaymentRecord } from "./payment-create-record";
import type { PaymentStatusTransitionInput } from "./payment-create-record";
import type { PaymentRepository } from "./payment.repository";

function toPayment(record: PrismaPayment): Payment {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    amount: record.amount.toString(),
    currency: record.currency,
    status: record.status,
    provider: record.provider,
    reference: record.reference,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as Record<string, unknown>)
        : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Payment | null> {
    const record = await this.db.payment.findFirst({
      where: { id, storeId },
    });

    return record ? toPayment(record) : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Payment[]> {
    const records = await this.db.payment.findMany({
      where: { storeId, orderId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toPayment);
  }

  async create(record: CreatePaymentRecord): Promise<Payment> {
    const created = await this.db.payment.create({
      data: {
        storeId: record.storeId,
        orderId: record.orderId,
        amount: record.amount,
        currency: record.currency,
        provider: record.provider,
        reference: record.reference,
        metadata: record.metadata
          ? (record.metadata as Prisma.InputJsonValue)
          : undefined,
        status: "pending",
      },
    });

    return toPayment(created);
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: PaymentStatusTransitionInput,
  ): Promise<Payment> {
    return this.db.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: {
          id,
          storeId,
          status: transition.fromStatus,
        },
        data: {
          status: transition.toStatus,
        },
      });

      if (updated.count === 0) {
        const existing = await tx.payment.findFirst({
          where: { id, storeId },
          select: { status: true },
        });

        if (!existing) {
          throw new Error(`Payment not found: ${id}`);
        }

        throw new Error(
          `Payment transition rejected: ${existing.status} -> ${transition.toStatus}`,
        );
      }

      const record = await tx.payment.findFirstOrThrow({
        where: { id, storeId },
      });

      return toPayment(record);
    });
  }
}
