import type {
  CatalogueListResult,
  OrderFulfillmentResult,
  ShipmentFulfillmentResult,
  StockMovement,
} from "@commerceflow/types";
import type {
  CreateFulfillmentInput,
  ListInventoryItemStockMovementsQuery,
  OrderFulfillmentActionQuery,
  StockMovementIdQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getStockMovementRepository,
  type StockMovementRepository,
} from "@/inventory/repositories";
import { FULFILLMENT_ERROR_CODES, FulfillmentError } from "../errors";
import {
  getFulfillmentRepository,
  type FulfillmentRepository,
} from "../repositories";

export interface FulfillmentServiceDependencies {
  readonly fulfillmentRepository?: FulfillmentRepository;
  readonly stockMovementRepository?: StockMovementRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class FulfillmentService {
  private readonly fulfillmentRepository: FulfillmentRepository;
  private readonly stockMovementRepository: StockMovementRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: FulfillmentServiceDependencies = {}) {
    this.fulfillmentRepository =
      dependencies.fulfillmentRepository ?? getFulfillmentRepository();
    this.stockMovementRepository =
      dependencies.stockMovementRepository ?? getStockMovementRepository();
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

      for (const stockMovement of result.stockMovements) {
        this.domainEventPublisher.publishStockMovementCreated(stockMovement);
      }

      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async fulfillShipment(
    input: CreateFulfillmentInput,
    shipmentId: string,
  ): Promise<ShipmentFulfillmentResult> {
    try {
      const result = await this.fulfillmentRepository.fulfillShipment(
        input.storeId,
        shipmentId,
      );

      this.domainEventPublisher.publishInventoryFulfilled(result);

      for (const stockMovement of result.stockMovements) {
        this.domainEventPublisher.publishStockMovementCreated(stockMovement);
      }

      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listStockMovements(
    inventoryItemId: string,
    query: ListInventoryItemStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>> {
    return this.stockMovementRepository.list({
      storeId: query.storeId,
      page: query.page,
      limit: query.limit,
      inventoryItemId,
    });
  }

  async getStockMovement(
    query: StockMovementIdQuery,
    id: string,
  ): Promise<StockMovement> {
    const stockMovement = await this.stockMovementRepository.findById(
      query.storeId,
      id,
    );

    if (!stockMovement) {
      throw new FulfillmentError(
        FULFILLMENT_ERROR_CODES.STOCK_MOVEMENT_NOT_FOUND,
        "Stock movement not found",
        404,
      );
    }

    return stockMovement;
  }

  private mapRepositoryError(error: unknown): FulfillmentError {
    if (error instanceof FulfillmentError) {
      return error;
    }

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

    if (error.message.includes("Shipment not found:")) {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    if (error.message === "SHIPMENT_ALREADY_FULFILLED") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.SHIPMENT_ALREADY_FULFILLED,
        "Shipment has already been fulfilled",
        409,
      );
    }

    if (error.message === "PICK_LIST_NOT_PACKED") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.PICK_LIST_NOT_PACKED,
        "Shipment must have a packed pick list before fulfillment",
        409,
      );
    }

    if (error.message === "INCOMPLETE_ALLOCATIONS") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.INCOMPLETE_ALLOCATIONS,
        "All pick list allocations must be fully picked before fulfillment",
        409,
      );
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return new FulfillmentError(
        FULFILLMENT_ERROR_CODES.INSUFFICIENT_STOCK,
        "Insufficient on-hand stock for fulfillment",
        409,
      );
    }

    return new FulfillmentError(
      FULFILLMENT_ERROR_CODES.TRANSACTION_FAILED,
      "Fulfillment transaction failed",
      500,
    );
  }
}

export const fulfillmentService = new FulfillmentService();
