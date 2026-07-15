import {
  type Refund as PrismaRefund,
  type PrismaClient,
} from "@prisma/client";
import type { Refund } from "@commerceflow/types";

import type { CreateRefundRecord } from "./refund-create-record";
import type { RefundStatusTransitionInput } from "./refund-create-record";
import type { RefundRepository } from "./refund.repository";

function toRefund(record: PrismaRefund): Refund {
  return {
    id: record.id,
    storeId: record.storeId,
    paymentId: record.paymentId,
    amount: record.amount.toString(),
    currency: record.currency,
    status: record.status,
    reason: record.reason,
    completedAt: record.completedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaRefundRepository implements RefundRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Refund | null> {
    const record = await this.db.refund.findFirst({
      where: { id, storeId },
    });

    return record ? toRefund(record) : null;
  }

  async findByPaymentId(
    storeId: string,
    paymentId: string,
  ): Promise<Refund | null> {
    const record = await this.db.refund.findFirst({
      where: { storeId, paymentId },
    });

    return record ? toRefund(record) : null;
  }

  async listByPaymentId(
    storeId: string,
    paymentId: string,
  ): Promise<readonly Refund[]> {
    const records = await this.db.refund.findMany({
      where: { storeId, paymentId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toRefund);
  }

  async create(record: CreateRefundRecord): Promise<Refund> {
    const created = await this.db.refund.create({
      data: {
        storeId: record.storeId,
        paymentId: record.paymentId,
        amount: record.amount,
        currency: record.currency,
        reason: record.reason,
        status: "pending",
      },
    });

    return toRefund(created);
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: RefundStatusTransitionInput,
  ): Promise<Refund> {
    return this.db.$transaction(async (tx) => {
      const updated = await tx.refund.updateMany({
        where: {
          id,
          storeId,
          status: transition.fromStatus,
        },
        data: {
          status: transition.toStatus,
          ...(transition.completedAt
            ? { completedAt: new Date(transition.completedAt) }
            : {}),
        },
      });

      if (updated.count === 0) {
        const existing = await tx.refund.findFirst({
          where: { id, storeId },
          select: { status: true },
        });

        if (!existing) {
          throw new Error(`Refund not found: ${id}`);
        }

        throw new Error(
          `Refund transition rejected: ${existing.status} -> ${transition.toStatus}`,
        );
      }

      const record = await tx.refund.findFirstOrThrow({
        where: { id, storeId },
      });

      return toRefund(record);
    });
  }
}
