import type { Refund } from "@commerceflow/types";

import type { CreateRefundRecord } from "./refund-create-record";
import type { RefundStatusTransitionInput } from "./refund-create-record";
import type { RefundRepository } from "./refund.repository";

export class MemoryRefundRepository implements RefundRepository {
  private readonly refundsById = new Map<string, Refund>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getRefundCount(): number {
    return this.refundsById.size;
  }

  async findById(storeId: string, id: string): Promise<Refund | null> {
    const refund = this.refundsById.get(id);
    return refund?.storeId === storeId ? refund : null;
  }

  async findByPaymentId(
    storeId: string,
    paymentId: string,
  ): Promise<Refund | null> {
    const refund = [...this.refundsById.values()].find(
      (entry) => entry.storeId === storeId && entry.paymentId === paymentId,
    );

    return refund ?? null;
  }

  async listByPaymentId(
    storeId: string,
    paymentId: string,
  ): Promise<readonly Refund[]> {
    return [...this.refundsById.values()]
      .filter(
        (refund) => refund.storeId === storeId && refund.paymentId === paymentId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async create(record: CreateRefundRecord): Promise<Refund> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findByPaymentId(record.storeId, record.paymentId);
    if (existing) {
      throw new Error(`Refund already exists for payment: ${record.paymentId}`);
    }

    const now = new Date().toISOString();
    const refund: Refund = {
      id: crypto.randomUUID(),
      storeId: record.storeId,
      paymentId: record.paymentId,
      amount: record.amount,
      currency: record.currency,
      status: "pending",
      reason: record.reason,
      createdAt: now,
      updatedAt: now,
    };

    this.refundsById.set(refund.id, refund);
    return refund;
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: RefundStatusTransitionInput,
  ): Promise<Refund> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.refundsById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Refund not found: ${id}`);
    }

    if (existing.status !== transition.fromStatus) {
      throw new Error(
        `Refund transition rejected: ${existing.status} -> ${transition.toStatus}`,
      );
    }

    const updated: Refund = {
      ...existing,
      status: transition.toStatus,
      completedAt: transition.completedAt ?? existing.completedAt,
      updatedAt: new Date().toISOString(),
    };

    this.refundsById.set(id, updated);
    return updated;
  }

  seedRefund(refund: Refund): void {
    this.refundsById.set(refund.id, refund);
  }
}
