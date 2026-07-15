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
import {
  getPaymentGatewayFactory,
  type PaymentGatewayFactory,
} from "../gateways";
import { PaymentStatusTransitionPolicy } from "../policies/payment-status-transition.policy";
import {
  getPaymentRepository,
  type PaymentRepository,
} from "../repositories";
import { generatePaymentReference } from "./payment-reference";

export interface PaymentServiceDependencies {
  readonly paymentRepository?: PaymentRepository;
  readonly orderRepository?: OrderRepository;
  readonly paymentGatewayFactory?: PaymentGatewayFactory;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PaymentService {
  private readonly paymentRepository: PaymentRepository;
  private readonly orderRepository: OrderRepository;
  private readonly paymentGatewayFactory: PaymentGatewayFactory;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PaymentServiceDependencies = {}) {
    this.paymentRepository =
      dependencies.paymentRepository ?? getPaymentRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.paymentGatewayFactory =
      dependencies.paymentGatewayFactory ?? getPaymentGatewayFactory();
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

    const gateway = this.paymentGatewayFactory.resolve(input.provider);
    const reference = generatePaymentReference();

    const initializeResult = await gateway.initializePayment({
      storeId,
      orderId,
      amount: order.subtotal,
      currency: order.currency,
      reference,
      provider: input.provider,
      metadata: input.metadata,
    });

    this.assertGatewaySuccess(initializeResult, "initialize");

    const payment = await this.paymentRepository.create({
      storeId,
      orderId,
      amount: order.subtotal,
      currency: order.currency,
      provider: input.provider,
      reference,
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
    return this.transitionPaymentWithGateway(
      query.storeId,
      paymentId,
      "authorized",
      (gateway, context) => gateway.authorizePayment(context),
    );
  }

  async markPaymentPaid(
    query: PaymentIdQuery,
    paymentId: string,
  ): Promise<Payment> {
    return this.transitionPaymentWithGateway(
      query.storeId,
      paymentId,
      "paid",
      (gateway, context) => gateway.capturePayment(context),
    );
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
    return this.transitionPaymentWithGateway(
      query.storeId,
      paymentId,
      "cancelled",
      (gateway, context) => gateway.cancelPayment(context),
    );
  }

  private async transitionPaymentWithGateway(
    storeId: string,
    paymentId: string,
    toStatus: PaymentStatus,
    gatewayOperation: (
      gateway: ReturnType<PaymentGatewayFactory["resolve"]>,
      context: Parameters<
        ReturnType<PaymentGatewayFactory["resolve"]>["authorizePayment"]
      >[0],
    ) => Promise<{ success: boolean; message?: string }>,
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

    const gateway = this.paymentGatewayFactory.resolve(existing.provider);
    const gatewayResult = await gatewayOperation(
      gateway,
      toGatewayContext(existing),
    );

    this.assertGatewaySuccess(gatewayResult, toStatus);

    return this.transitionPayment(storeId, paymentId, toStatus);
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

  private assertGatewaySuccess(
    result: { success: boolean; message?: string },
    operation: string,
  ): void {
    if (!result.success) {
      throw new PaymentError(
        PAYMENT_ERROR_CODES.GATEWAY_ERROR,
        result.message ?? `Payment gateway ${operation} failed`,
        502,
      );
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

function toGatewayContext(payment: Payment) {
  return {
    storeId: payment.storeId,
    orderId: payment.orderId,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    provider: payment.provider,
    status: payment.status,
    metadata: payment.metadata,
  };
}

export const paymentService = new PaymentService();
