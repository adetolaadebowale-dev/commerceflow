import type { Shipment, ShipmentStatus } from "@commerceflow/types";
import type {
  CreateShipmentInput,
  ListOrderShipmentsQuery,
  ShipmentIdQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import { SHIPMENT_ERROR_CODES, ShipmentError } from "../errors";
import {
  getShipmentCarrierGatewayFactory,
  type ShipmentCarrierGatewayFactory,
} from "../gateways";
import { ShipmentStatusTransitionPolicy } from "../policies/shipment-status-transition.policy";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "../repositories";
import {
  requireOrderShippingAddress,
  toShipmentAddressFields,
} from "./shipment-address";
import { toShipmentDispatchContext } from "./shipment-gateway-context";
import { generateShipmentNumber } from "./shipment-number";

export interface ShipmentServiceDependencies {
  readonly shipmentRepository?: ShipmentRepository;
  readonly orderRepository?: OrderRepository;
  readonly shipmentCarrierGatewayFactory?: ShipmentCarrierGatewayFactory;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ShipmentService {
  private readonly shipmentRepository: ShipmentRepository;
  private readonly orderRepository: OrderRepository;
  private readonly shipmentCarrierGatewayFactory: ShipmentCarrierGatewayFactory;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ShipmentServiceDependencies = {}) {
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.shipmentCarrierGatewayFactory =
      dependencies.shipmentCarrierGatewayFactory ??
      getShipmentCarrierGatewayFactory();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createShipment(
    storeId: string,
    orderId: string,
    input: CreateShipmentInput,
  ): Promise<Shipment> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    if (order.status !== "fulfilled") {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.ORDER_NOT_FULFILLED,
        "Order must be fulfilled before creating a shipment",
        409,
      );
    }

    const existing = await this.shipmentRepository.findByOrderId(
      storeId,
      orderId,
    );

    if (existing) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.ALREADY_EXISTS,
        "Order already has a shipment",
        409,
      );
    }

    const shippingAddress = requireOrderShippingAddress(order);
    const addressFields = toShipmentAddressFields(shippingAddress);
    const gateway = this.shipmentCarrierGatewayFactory.resolve(input.carrier);
    const shipmentNumber = generateShipmentNumber();

    const initializeResult = await gateway.initializeShipment({
      storeId,
      orderId,
      shipmentNumber,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      ...addressFields,
      metadata: input.metadata,
    });

    this.assertGatewaySuccess(initializeResult, "initialize");

    try {
      const shipment = await this.shipmentRepository.create({
        storeId,
        orderId,
        shipmentNumber,
        carrier: input.carrier,
        trackingNumber:
          input.trackingNumber ?? initializeResult.trackingNumber,
        ...addressFields,
      });

      this.domainEventPublisher.publishShipmentCreated(shipment);
      return shipment;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getShipment(storeId: string, shipmentId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    return shipment;
  }

  async listOrderShipments(
    query: ListOrderShipmentsQuery,
    orderId: string,
  ): Promise<readonly Shipment[]> {
    const order = await this.orderRepository.findById(query.storeId, orderId);

    if (!order) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    return this.shipmentRepository.listByOrderId(query.storeId, orderId);
  }

  async packShipment(query: ShipmentIdQuery, shipmentId: string): Promise<Shipment> {
    return this.transitionShipment(query.storeId, shipmentId, "packed");
  }

  async shipShipment(query: ShipmentIdQuery, shipmentId: string): Promise<Shipment> {
    const existing = await this.requireShipment(query.storeId, shipmentId);

    if (
      !ShipmentStatusTransitionPolicy.canTransition(existing.status, "shipped")
    ) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition shipment from ${existing.status} to shipped`,
        409,
      );
    }

    const gateway = this.shipmentCarrierGatewayFactory.resolve(existing.carrier);
    const dispatchResult = await gateway.dispatchShipment(
      toShipmentDispatchContext(existing),
    );

    this.assertGatewaySuccess(dispatchResult, "dispatch");

    return this.transitionShipment(query.storeId, shipmentId, "shipped", {
      shippedAt: new Date().toISOString(),
      trackingNumber: dispatchResult.trackingNumber ?? existing.trackingNumber,
    });
  }

  async deliverShipment(
    query: ShipmentIdQuery,
    shipmentId: string,
  ): Promise<Shipment> {
    return this.transitionShipment(query.storeId, shipmentId, "delivered", {
      deliveredAt: new Date().toISOString(),
    });
  }

  async cancelShipment(
    query: ShipmentIdQuery,
    shipmentId: string,
  ): Promise<Shipment> {
    const existing = await this.requireShipment(query.storeId, shipmentId);

    if (
      !ShipmentStatusTransitionPolicy.canTransition(existing.status, "cancelled")
    ) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition shipment from ${existing.status} to cancelled`,
        409,
      );
    }

    const gateway = this.shipmentCarrierGatewayFactory.resolve(existing.carrier);
    const cancelResult = await gateway.cancelShipment(
      toShipmentDispatchContext(existing),
    );

    this.assertGatewaySuccess(cancelResult, "cancel");

    return this.transitionShipment(query.storeId, shipmentId, "cancelled");
  }

  private async transitionShipment(
    storeId: string,
    shipmentId: string,
    toStatus: ShipmentStatus,
    timestamps: {
      shippedAt?: string;
      deliveredAt?: string;
      trackingNumber?: string;
    } = {},
  ): Promise<Shipment> {
    const existing = await this.requireShipment(storeId, shipmentId);

    if (
      !ShipmentStatusTransitionPolicy.canTransition(existing.status, toStatus)
    ) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition shipment from ${existing.status} to ${toStatus}`,
        409,
      );
    }

    try {
      const shipment = await this.shipmentRepository.transitionStatus(
        storeId,
        shipmentId,
        {
          fromStatus: existing.status,
          toStatus,
          ...timestamps,
        },
      );

      this.publishTransitionEvent(shipment, existing.status);
      return shipment;
    } catch (error) {
      throw this.mapRepositoryError(error, existing.status, toStatus);
    }
  }

  private assertGatewaySuccess(
    result: { success: boolean; message?: string },
    operation: string,
  ): void {
    if (!result.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.CARRIER_ERROR,
        result.message ?? `Shipment carrier ${operation} failed`,
        502,
      );
    }
  }

  private async requireShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    return shipment;
  }

  private publishTransitionEvent(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    switch (shipment.status) {
      case "shipped":
        this.domainEventPublisher.publishShipmentShipped(shipment, previousStatus);
        break;
      case "delivered":
        this.domainEventPublisher.publishShipmentDelivered(
          shipment,
          previousStatus,
        );
        break;
      case "cancelled":
        this.domainEventPublisher.publishShipmentCancelled(
          shipment,
          previousStatus,
        );
        break;
      default:
        break;
    }
  }

  private mapRepositoryError(
    error: unknown,
    fromStatus?: ShipmentStatus,
    toStatus?: ShipmentStatus,
  ): ShipmentError {
    if (
      error instanceof Error &&
      error.message.startsWith("Shipment not found:")
    ) {
      return new ShipmentError(
        SHIPMENT_ERROR_CODES.NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Shipment transition rejected:")
    ) {
      return new ShipmentError(
        SHIPMENT_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition shipment from ${fromStatus} to ${toStatus}`,
        409,
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return new ShipmentError(
        SHIPMENT_ERROR_CODES.ALREADY_EXISTS,
        "Order already has a shipment",
        409,
      );
    }

    if (error instanceof ShipmentError) {
      return error;
    }

    return new ShipmentError(
      SHIPMENT_ERROR_CODES.TRANSACTION_FAILED,
      "Shipment transaction failed",
      500,
    );
  }
}

export const shipmentService = new ShipmentService();
