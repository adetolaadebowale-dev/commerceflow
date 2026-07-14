import type { OrderFulfillmentResult } from "@commerceflow/types";
import type { OrderFulfillmentActionQuery } from "@commerceflow/validation";

import { FULFILLMENT_ERROR_CODES, FulfillmentError } from "../errors";
import {
  getFulfillmentRepository,
  type FulfillmentRepository,
} from "../repositories";
import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";

export interface FulfillmentServiceDependencies {
  readonly fulfillmentRepository?: FulfillmentRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class FulfillmentService {
  private readonly fulfillmentRepository: FulfillmentRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: FulfillmentServiceDependencies = {}) {
    this.fulfillmentRepository =
      dependencies.fulfillmentRepository ?? getFulfillmentRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async fulfillOrder(
    input: OrderFulfillmentActionQuery,
    orderId: string,
  ): Promise<OrderFulfillmentResult> {
    try {
      const result = await this.fulfillmentRepository.fulfillOrder(
        input.storeId,
        orderId,
      );
      this.domainEventPublisher.publishOrderFulfilled(result);
      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private mapRepositoryError(error: unknown): FulfillmentError {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message.includes("Order not found:")) {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    if (error.message === "ORDER_ALREADY_FULFILLED") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.ORDER_ALREADY_FULFILLED,
        "Order has already been fulfilled",
        409,
      );
    }

    if (error.message === "ORDER_NOT_CONFIRMED") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.ORDER_NOT_CONFIRMED,
        "Only confirmed orders with active reservations may be fulfilled",
        409,
      );
    }

    if (error.message === "NO_ACTIVE_RESERVATIONS") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.NO_ACTIVE_RESERVATIONS,
        "Order has no active inventory reservations",
        409,
      );
    }

    if (error.message === "RESERVATION_MISMATCH") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.RESERVATION_MISMATCH,
        "Order reservations do not match order line items",
        409,
      );
    }

    if (error.message === "INSUFFICIENT_RESERVED_STOCK") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.INSUFFICIENT_RESERVED_STOCK,
        "Insufficient reserved stock for fulfillment",
        409,
      );
    }

    throw error;
  }
}

export const fulfillmentService = new FulfillmentService();
