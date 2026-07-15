import type { Refund, RefundStatus } from "@commerceflow/types";
import type {
  CreateRefundInput,
  ListPaymentRefundsQuery,
  RefundIdQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getPaymentRepository,
  type PaymentRepository,
} from "@/payments/repositories";
import { REFUND_ERROR_CODES, RefundError } from "../errors";
import { RefundStatusTransitionPolicy } from "../policies/refund-status-transition.policy";
import {
  getRefundRepository,
  type RefundRepository,
} from "../repositories";

export interface RefundServiceDependencies {
  readonly refundRepository?: RefundRepository;
  readonly paymentRepository?: PaymentRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class RefundService {
  private readonly refundRepository: RefundRepository;
  private readonly paymentRepository: PaymentRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: RefundServiceDependencies = {}) {
    this.refundRepository =
      dependencies.refundRepository ?? getRefundRepository();
    this.paymentRepository =
      dependencies.paymentRepository ?? getPaymentRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createRefund(
    storeId: string,
    paymentId: string,
    input: CreateRefundInput,
  ): Promise<Refund> {
    const payment = await this.paymentRepository.findById(storeId, paymentId);

    if (!payment) {
      throw new RefundError(
        REFUND_ERROR_CODES.PAYMENT_NOT_FOUND,
        "Payment not found",
        404,
      );
    }

    if (payment.status !== "paid") {
      throw new RefundError(
        REFUND_ERROR_CODES.PAYMENT_NOT_REFUNDABLE,
        "Only paid payments may be refunded",
        409,
      );
    }

    const existing = await this.refundRepository.findByPaymentId(
      storeId,
      paymentId,
    );

    if (existing) {
      throw new RefundError(
        REFUND_ERROR_CODES.ALREADY_EXISTS,
        "Payment already has a refund",
        409,
      );
    }

    try {
      const refund = await this.refundRepository.create({
        storeId,
        paymentId,
        amount: payment.amount,
        currency: payment.currency,
        reason: input.reason,
      });

      this.domainEventPublisher.publishRefundCreated(refund);
      return refund;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getRefund(storeId: string, refundId: string): Promise<Refund> {
    const refund = await this.refundRepository.findById(storeId, refundId);

    if (!refund) {
      throw new RefundError(
        REFUND_ERROR_CODES.NOT_FOUND,
        "Refund not found",
        404,
      );
    }

    return refund;
  }

  async listPaymentRefunds(
    query: ListPaymentRefundsQuery,
    paymentId: string,
  ): Promise<readonly Refund[]> {
    const payment = await this.paymentRepository.findById(
      query.storeId,
      paymentId,
    );

    if (!payment) {
      throw new RefundError(
        REFUND_ERROR_CODES.PAYMENT_NOT_FOUND,
        "Payment not found",
        404,
      );
    }

    return this.refundRepository.listByPaymentId(query.storeId, paymentId);
  }

  async completeRefund(query: RefundIdQuery, refundId: string): Promise<Refund> {
    return this.transitionRefund(query.storeId, refundId, "completed", {
      completedAt: new Date().toISOString(),
    });
  }

  async cancelRefund(query: RefundIdQuery, refundId: string): Promise<Refund> {
    return this.transitionRefund(query.storeId, refundId, "cancelled");
  }

  private async transitionRefund(
    storeId: string,
    refundId: string,
    toStatus: RefundStatus,
    timestamps: { completedAt?: string } = {},
  ): Promise<Refund> {
    const existing = await this.requireRefund(storeId, refundId);

    if (existing.status === "completed") {
      throw new RefundError(
        REFUND_ERROR_CODES.IMMUTABLE,
        "Completed refunds are immutable",
        409,
      );
    }

    if (!RefundStatusTransitionPolicy.canTransition(existing.status, toStatus)) {
      throw new RefundError(
        REFUND_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition refund from ${existing.status} to ${toStatus}`,
        409,
      );
    }

    try {
      const refund = await this.refundRepository.transitionStatus(
        storeId,
        refundId,
        {
          fromStatus: existing.status,
          toStatus,
          ...timestamps,
        },
      );

      this.publishTransitionEvent(refund, existing.status);
      return refund;
    } catch (error) {
      throw this.mapRepositoryError(error, existing.status, toStatus);
    }
  }

  private async requireRefund(
    storeId: string,
    refundId: string,
  ): Promise<Refund> {
    const refund = await this.refundRepository.findById(storeId, refundId);

    if (!refund) {
      throw new RefundError(
        REFUND_ERROR_CODES.NOT_FOUND,
        "Refund not found",
        404,
      );
    }

    return refund;
  }

  private publishTransitionEvent(
    refund: Refund,
    previousStatus: RefundStatus,
  ): void {
    switch (refund.status) {
      case "completed":
        this.domainEventPublisher.publishRefundCompleted(refund, previousStatus);
        break;
      case "cancelled":
        this.domainEventPublisher.publishRefundCancelled(refund, previousStatus);
        break;
      default:
        break;
    }
  }

  private mapRepositoryError(
    error: unknown,
    fromStatus?: RefundStatus,
    toStatus?: RefundStatus,
  ): RefundError {
    if (error instanceof Error && error.message.startsWith("Refund not found:")) {
      return new RefundError(
        REFUND_ERROR_CODES.NOT_FOUND,
        "Refund not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Refund transition rejected:")
    ) {
      return new RefundError(
        REFUND_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition refund from ${fromStatus} to ${toStatus}`,
        409,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Refund already exists for payment:")
    ) {
      return new RefundError(
        REFUND_ERROR_CODES.ALREADY_EXISTS,
        "Payment already has a refund",
        409,
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return new RefundError(
        REFUND_ERROR_CODES.ALREADY_EXISTS,
        "Payment already has a refund",
        409,
      );
    }

    if (error instanceof RefundError) {
      return error;
    }

    return new RefundError(
      REFUND_ERROR_CODES.TRANSACTION_FAILED,
      "Refund transaction failed",
      500,
    );
  }
}

export const refundService = new RefundService();
