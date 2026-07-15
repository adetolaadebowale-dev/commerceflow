import type { Payment, PaymentStatus } from "@commerceflow/types";
import type {
  CreatePaymentInput,
  ListOrderPaymentsQuery,
  PaymentIdQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import { PAYMENT_ERROR_CODES, PaymentError } from "../errors";
import { PaymentStatusTransitionPolicy } from "../policies/payment-status-transition.policy";
import {
  getPaymentRepository,
  type PaymentRepository,
} from "../repositories";
import { generatePaymentReference } from "./payment-reference";

export interface PaymentServiceDependencies {
  readonly paymentRepository?: PaymentRepository;
  readonly orderRepository?: OrderRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PaymentService {
  private readonly paymentRepository: PaymentRepository;
  private readonly orderRepository: OrderRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PaymentServiceDependencies = {}) {
    this.paymentRepository =
      dependencies.paymentRepository ?? getPaymentRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createPayment(
    storeId: string,
    orderId: string,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    const payment = await this.paymentRepository.create({
      storeId,
      orderId,
      amount: order.subtotal,
      currency: order.currency,
      provider: input.provider,
      reference: generatePaymentReference(),
      metadata: input.metadata,
    });

    this.domainEventPublisher.publishPaymentCreated(payment);
    return payment;
  }

  async getPayment(storeId: string, paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(storeId, paymentId);

    if (!payment) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.NOT_FOUND,
        "Payment not found",
        404,
      );
    }

    return payment;
  }

  async listOrderPayments(
    query: ListOrderPaymentsQuery,
    orderId: string,
  ): Promise<readonly Payment[]> {
    const order = await this.orderRepository.findById(query.storeId, orderId);

    if (!order) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    return this.paymentRepository.listByOrderId(query.storeId, orderId);
  }

  async authorizePayment(
    query: PaymentIdQuery,
    paymentId: string,
  ): Promise<Payment> {
    return this.transitionPayment(query.storeId, paymentId, "authorized");
  }

  async markPaymentPaid(
    query: PaymentIdQuery,
    paymentId: string,
  ): Promise<Payment> {
    return this.transitionPayment(query.storeId, paymentId, "paid");
  }

  async failPayment(
    query: PaymentIdQuery,
    paymentId: string,
  ): Promise<Payment> {
    return this.transitionPayment(query.storeId, paymentId, "failed");
  }

  async cancelPayment(
    query: PaymentIdQuery,
    paymentId: string,
  ): Promise<Payment> {
    return this.transitionPayment(query.storeId, paymentId, "cancelled");
  }

  private async transitionPayment(
    storeId: string,
    paymentId: string,
    toStatus: PaymentStatus,
  ): Promise<Payment> {
    const existing = await this.paymentRepository.findById(storeId, paymentId);

    if (!existing) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.NOT_FOUND,
        "Payment not found",
        404,
      );
    }

    if (!PaymentStatusTransitionPolicy.canTransition(existing.status, toStatus)) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition payment from ${existing.status} to ${toStatus}`,
        409,
      );
    }

    try {
      const payment = await this.paymentRepository.transitionStatus(
        storeId,
        paymentId,
        {
          fromStatus: existing.status,
          toStatus,
        },
      );

      this.publishTransitionEvent(payment, existing.status);
      return payment;
    } catch (error) {
      throw this.mapRepositoryError(error, existing.status, toStatus);
    }
  }

  private publishTransitionEvent(
    payment: Payment,
    previousStatus: PaymentStatus,
  ): void {
    switch (payment.status) {
      case "authorized":
        this.domainEventPublisher.publishPaymentAuthorized(payment, previousStatus);
        break;
      case "paid":
        this.domainEventPublisher.publishPaymentPaid(payment, previousStatus);
        break;
      case "failed":
        this.domainEventPublisher.publishPaymentFailed(payment, previousStatus);
        break;
      case "cancelled":
        this.domainEventPublisher.publishPaymentCancelled(payment, previousStatus);
        break;
      default:
        break;
    }
  }

  private mapRepositoryError(
    error: unknown,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
  ): PaymentError {
    if (error instanceof Error && error.message.startsWith("Payment not found:")) {
      return new PaymentError(
        PAYMENT_ERROR_CODES.NOT_FOUND,
        "Payment not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Payment transition rejected:")
    ) {
      return new PaymentError(
        PAYMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition payment from ${fromStatus} to ${toStatus}`,
        409,
      );
    }

    if (error instanceof PaymentError) {
      return error;
    }

    return new PaymentError(
      PAYMENT_ERROR_CODES.TRANSACTION_FAILED,
      "Payment transaction failed",
      500,
    );
  }
}

export const paymentService = new PaymentService();
