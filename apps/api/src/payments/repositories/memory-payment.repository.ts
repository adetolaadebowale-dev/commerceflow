import type { Payment } from "@commerceflow/types";

import type { CreatePaymentRecord } from "./payment-create-record";
import type { PaymentStatusTransitionInput } from "./payment-create-record";
import type { PaymentRepository } from "./payment.repository";

export class MemoryPaymentRepository implements PaymentRepository {
  private readonly paymentsById = new Map<string, Payment>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getPaymentCount(): number {
    return this.paymentsById.size;
  }

  async findById(storeId: string, id: string): Promise<Payment | null> {
    const payment = this.paymentsById.get(id);
    return payment?.storeId === storeId ? payment : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Payment[]> {
    return [...this.paymentsById.values()]
      .filter(
        (payment) => payment.storeId === storeId && payment.orderId === orderId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async create(record: CreatePaymentRecord): Promise<Payment> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const now = new Date().toISOString();
    const payment: Payment = {
      id: crypto.randomUUID(),
      storeId: record.storeId,
      orderId: record.orderId,
      amount: record.amount,
      currency: record.currency,
      status: "pending",
      provider: record.provider,
      reference: record.reference,
      metadata: record.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.paymentsById.set(payment.id, payment);
    return payment;
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: PaymentStatusTransitionInput,
  ): Promise<Payment> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.paymentsById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Payment not found: ${id}`);
    }

    if (existing.status !== transition.fromStatus) {
      throw new Error(
        `Payment transition rejected: ${existing.status} -> ${transition.toStatus}`,
      );
    }

    const updated: Payment = {
      ...existing,
      status: transition.toStatus,
      updatedAt: new Date().toISOString(),
    };

    this.paymentsById.set(id, updated);
    return updated;
  }

  seedPayment(payment: Payment): void {
    this.paymentsById.set(payment.id, payment);
  }
}
