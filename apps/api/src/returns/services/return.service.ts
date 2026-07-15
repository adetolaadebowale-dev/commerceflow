import type { Return, ReturnCompletionResult } from "@commerceflow/types";
import type {
  CompleteReturnInput,
  CreateReturnInput,
  InspectReturnInput,
  ListReturnsQuery,
  ReceiveReturnInput,
  ReturnIdQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getInventoryItemRepository,
  type InventoryItemRepository,
} from "@/inventory/repositories";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "@/shipments/repositories";
import { RETURN_ERROR_CODES, ReturnError } from "../errors";
import { ReturnStatusTransitionPolicy } from "../policies/return-status-transition.policy";
import {
  getReturnRepository,
  type ReturnRepository,
} from "../repositories";
import {
  generateReturnNumber,
  isUniqueReturnNumberViolation,
} from "./return-number";

export interface ReturnServiceDependencies {
  readonly returnRepository?: ReturnRepository;
  readonly orderRepository?: OrderRepository;
  readonly shipmentRepository?: ShipmentRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ReturnService {
  private readonly returnRepository: ReturnRepository;
  private readonly orderRepository: OrderRepository;
  private readonly shipmentRepository: ShipmentRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ReturnServiceDependencies = {}) {
    this.returnRepository =
      dependencies.returnRepository ?? getReturnRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createReturn(
    orderId: string,
    input: CreateReturnInput,
  ): Promise<Return> {
    const order = await this.orderRepository.findById(input.storeId, orderId);

    if (!order) {
      throw new ReturnError(
        RETURN_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    const shipment = await this.shipmentRepository.findById(
      input.storeId,
      input.shipmentId,
    );

    if (!shipment || shipment.orderId !== orderId) {
      throw new ReturnError(
        RETURN_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment not found for order",
        404,
      );
    }

    if (!shipment.fulfilledAt) {
      throw new ReturnError(
        RETURN_ERROR_CODES.SHIPMENT_NOT_FULFILLED,
        "Shipment must be fulfilled before creating a return",
        409,
      );
    }

    const orderItemsById = new Map(order.items.map((item) => [item.id, item]));

    for (const item of input.items) {
      const orderItem = orderItemsById.get(item.orderItemId);

      if (!orderItem) {
        throw new ReturnError(
          RETURN_ERROR_CODES.RETURN_ITEM_NOT_FOUND,
          "Order item not found on return",
          404,
        );
      }

      const inventoryItem = await this.inventoryItemRepository.findById(
        input.storeId,
        item.inventoryItemId,
      );

      if (
        !inventoryItem ||
        inventoryItem.productVariantId !== orderItem.productVariantId
      ) {
        throw new ReturnError(
          RETURN_ERROR_CODES.INVENTORY_ITEM_MISMATCH,
          "Inventory item does not match order item variant",
          409,
        );
      }

      const previouslyReturned =
        await this.returnRepository.sumRequestedQuantityByOrderItemId(
          input.storeId,
          item.orderItemId,
        );

      if (previouslyReturned + item.quantityRequested > orderItem.quantity) {
        throw new ReturnError(
          RETURN_ERROR_CODES.QUANTITY_EXCEEDED,
          "Return quantity exceeds fulfilled order quantity",
          409,
        );
      }
    }

    try {
      const returnRecord = await this.createWithUniqueNumber({
        storeId: input.storeId,
        orderId,
        shipmentId: input.shipmentId,
        reason: input.reason,
        notes: input.notes,
        requestedAt: new Date(),
        items: input.items,
      });

      this.domainEventPublisher.publishReturnCreated(returnRecord);
      return returnRecord;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listReturns(
    orderId: string,
    query: ListReturnsQuery,
  ): Promise<readonly Return[]> {
    await this.requireOrder(query.storeId, orderId);
    return this.returnRepository.listByOrderId(query.storeId, orderId);
  }

  async getReturn(query: ReturnIdQuery, id: string): Promise<Return> {
    const returnRecord = await this.returnRepository.findById(
      query.storeId,
      id,
    );

    if (!returnRecord) {
      throw new ReturnError(
        RETURN_ERROR_CODES.RETURN_NOT_FOUND,
        "Return not found",
        404,
      );
    }

    return returnRecord;
  }

  async receiveReturn(
    id: string,
    input: ReceiveReturnInput,
  ): Promise<Return> {
    const existing = await this.getReturn(input, id);

    if (!ReturnStatusTransitionPolicy.canTransition(existing.status, "received")) {
      throw new ReturnError(
        RETURN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Return cannot be received in its current status",
        409,
      );
    }

    try {
      const returnRecord = await this.returnRepository.receiveReturn(
        input.storeId,
        id,
        input,
        new Date(),
      );

      this.domainEventPublisher.publishReturnReceived(returnRecord);
      return returnRecord;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async inspectReturn(
    id: string,
    input: InspectReturnInput,
  ): Promise<Return> {
    const existing = await this.getReturn(input, id);

    if (!ReturnStatusTransitionPolicy.canTransition(existing.status, "inspecting")) {
      throw new ReturnError(
        RETURN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Return cannot be inspected in its current status",
        409,
      );
    }

    try {
      const returnRecord = await this.returnRepository.inspectReturn(
        input.storeId,
        id,
        input,
      );

      this.domainEventPublisher.publishReturnInspected(returnRecord);
      return returnRecord;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async completeReturn(
    id: string,
    input: CompleteReturnInput,
  ): Promise<ReturnCompletionResult> {
    const existing = await this.getReturn(input, id);

    if (
      !ReturnStatusTransitionPolicy.canTransition(existing.status, "completed") &&
      !ReturnStatusTransitionPolicy.canTransition(existing.status, "rejected")
    ) {
      throw new ReturnError(
        RETURN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Return cannot be completed in its current status",
        409,
      );
    }

    try {
      const result = await this.returnRepository.completeReturn(
        input.storeId,
        id,
        input,
        new Date(),
      );

      this.domainEventPublisher.publishReturnCompleted(result);

      for (const stockMovement of result.stockMovements) {
        this.domainEventPublisher.publishStockMovementCreated(stockMovement);
      }

      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async createWithUniqueNumber(
    record: Omit<import("../repositories/return.repository").CreateReturnRecord, "returnNumber">,
  ): Promise<Return> {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.returnRepository.create({
          ...record,
          returnNumber: generateReturnNumber(),
        });
      } catch (error) {
        if (!isUniqueReturnNumberViolation(error) || attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error("Failed to generate unique return number");
  }

  private async requireOrder(storeId: string, orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new ReturnError(
        RETURN_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }
  }

  private mapRepositoryError(error: unknown): ReturnError {
    if (error instanceof ReturnError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.message.startsWith("Return not found")) {
        return new ReturnError(
          RETURN_ERROR_CODES.RETURN_NOT_FOUND,
          "Return not found",
          404,
        );
      }

      if (error.message.startsWith("ReturnItem not found")) {
        return new ReturnError(
          RETURN_ERROR_CODES.RETURN_ITEM_NOT_FOUND,
          "Return item not found",
          404,
        );
      }

      if (error.message === "INVALID_STATUS_TRANSITION") {
        return new ReturnError(
          RETURN_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid return status transition",
          409,
        );
      }

      if (error.message === "QUANTITY_EXCEEDED") {
        return new ReturnError(
          RETURN_ERROR_CODES.QUANTITY_EXCEEDED,
          "Return quantity exceeds allowed amount",
          409,
        );
      }

      return new ReturnError(
        RETURN_ERROR_CODES.TRANSACTION_FAILED,
        "Return transaction failed",
        500,
      );
    }

    return new ReturnError(
      RETURN_ERROR_CODES.TRANSACTION_FAILED,
      "Return transaction failed",
      500,
    );
  }
}

export const returnService = new ReturnService();
